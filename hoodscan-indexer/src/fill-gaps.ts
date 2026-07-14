/**
 * Gap filler — re-fetches block numbers that are missing from the Block
 * table between 0 and max(number), without touching BackfillProgress.
 *
 * Safe to run while the main backfill is still advancing the tip:
 * - only INSERTs missing rows (createMany + skipDuplicates)
 * - never updates lastIndexedBlock / targetBlock
 * - uses its own lower RPS so it does not starve the main job of Alchemy CU
 *
 * Usage:
 *   pnpm run fill-gaps
 *
 * Optional env (defaults are conservative on purpose):
 *   GAP_FILL_CONCURRENCY=5
 *   GAP_FILL_MAX_RPS=5
 *   RPC_FETCH_MAX_ATTEMPTS=8
 */
import "dotenv/config";
import { prisma } from "./db";
import { getRpcClient, rpcClientCount } from "./rpc";
import { decodeBlock, decodeTransaction, type RawBlock, type RawTransaction } from "./decoder";

const CONCURRENCY = Number(process.env.GAP_FILL_CONCURRENCY ?? 5);
const MAX_RPS = Number(process.env.GAP_FILL_MAX_RPS ?? 5);
const FETCH_MAX_ATTEMPTS = Number(process.env.RPC_FETCH_MAX_ATTEMPTS ?? 8);
const MIN_WINDOW_MS = (CONCURRENCY / MAX_RPS) * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /429|Too Many Requests|timeout|timed out|ECONNRESET|ECONNREFUSED|fetch failed|socket|503|502|504/i.test(
    msg
  );
}

type Fetched = {
  block: ReturnType<typeof decodeBlock>;
  transactions: ReturnType<typeof decodeTransaction>[];
};

async function fetchBlock(blockNumber: bigint): Promise<Fetched | null> {
  const hex = "0x" + blockNumber.toString(16);
  const raw = (await getRpcClient().request({
    method: "eth_getBlockByNumber",
    params: [hex, true],
  })) as unknown as RawBlock;

  if (!raw) return null;

  return {
    block: decodeBlock(raw),
    transactions: (raw.transactions as RawTransaction[]).map(decodeTransaction),
  };
}

async function fetchBlockWithRetry(blockNumber: bigint): Promise<Fetched | null> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchBlock(blockNumber);
    } catch (err) {
      lastErr = err;
      if (!isRetriableError(err) || attempt === FETCH_MAX_ATTEMPTS) break;
      const delayMs = Math.min(20_000, 500 * 2 ** (attempt - 1));
      console.warn(
        `[fill-gaps] block ${blockNumber} attempt ${attempt}/${FETCH_MAX_ATTEMPTS} failed, ` +
          `retry in ${delayMs}ms`
      );
      await sleep(delayMs);
    }
  }

  throw lastErr;
}

/**
 * Find contiguous missing ranges using "next number not present" gaps,
 * then expand to a flat list of block numbers.
 */
async function findMissingBlockNumbers(): Promise<bigint[]> {
  const rows = await prisma.$queryRaw<
    { gap_start: bigint; gap_end: bigint; gap_size: bigint }[]
  >`
    SELECT
      b.number + 1 AS gap_start,
      (
        SELECT MIN(b2.number) - 1
        FROM "Block" b2
        WHERE b2.number > b.number
      ) AS gap_end,
      (
        SELECT MIN(b2.number) - 1
        FROM "Block" b2
        WHERE b2.number > b.number
      ) - (b.number + 1) + 1 AS gap_size
    FROM "Block" b
    WHERE b.number < (SELECT MAX(number) FROM "Block")
      AND NOT EXISTS (
        SELECT 1 FROM "Block" n WHERE n.number = b.number + 1
      )
    ORDER BY gap_start
  `;

  const missing: bigint[] = [];
  for (const row of rows) {
    if (row.gap_end == null) continue;
    for (let n = row.gap_start; n <= row.gap_end; n++) {
      missing.push(n);
    }
  }
  return missing;
}

async function flush(batch: Fetched[]) {
  if (batch.length === 0) return;
  await prisma.block.createMany({
    data: batch.map((b) => b.block),
    skipDuplicates: true,
  });
  const txs = batch.flatMap((b) => b.transactions);
  if (txs.length > 0) {
    await prisma.transaction.createMany({
      data: txs,
      skipDuplicates: true,
    });
  }
}

async function main() {
  const stats = await prisma.block.aggregate({
    _count: true,
    _min: { number: true },
    _max: { number: true },
  });

  console.log(
    `[fill-gaps] DB range ${stats._min.number ?? "∅"} … ${stats._max.number ?? "∅"} ` +
      `(${stats._count} rows). Looking for holes… ` +
      `(concurrency=${CONCURRENCY}, maxRps=${MAX_RPS}, rpcEndpoints=${rpcClientCount})`
  );
  console.log(
    `[fill-gaps] Will NOT touch BackfillProgress — main backfill can keep running.`
  );

  const missing = await findMissingBlockNumbers();

  if (missing.length === 0) {
    console.log(`[fill-gaps] No gaps found. Nothing to do.`);
    return;
  }

  console.log(
    `[fill-gaps] Found ${missing.length} missing block(s). ` +
      `First: ${missing[0]}, last: ${missing[missing.length - 1]}`
  );

  let filled = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const windowStartedAt = Date.now();
    const window = missing.slice(i, i + CONCURRENCY);

    const results = await Promise.all(
      window.map(async (n) => {
        try {
          const data = await fetchBlockWithRetry(n);
          if (!data) {
            console.warn(`[fill-gaps] block ${n}: RPC returned null (skipped)`);
            failed++;
            return null;
          }
          return data;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[fill-gaps] block ${n} failed:`, msg.split("\n")[0]);
          failed++;
          return null;
        }
      })
    );

    const batch = results.filter((r): r is Fetched => r != null);
    await flush(batch);
    filled += batch.length;

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(
      `[fill-gaps] Progress ${Math.min(i + window.length, missing.length)}/${missing.length} ` +
        `(filled=${filled}, failed=${failed}, ${elapsed.toFixed(1)}s)`
    );

    const windowElapsedMs = Date.now() - windowStartedAt;
    if (windowElapsedMs < MIN_WINDOW_MS) {
      await sleep(MIN_WINDOW_MS - windowElapsedMs);
    }
  }

  // Re-scan to confirm
  const stillMissing = await findMissingBlockNumbers();
  console.log(
    `[fill-gaps] Done. filled=${filled}, failed=${failed}, ` +
      `stillMissing=${stillMissing.length}` +
      (stillMissing.length > 0
        ? ` (e.g. ${stillMissing.slice(0, 10).join(", ")}${stillMissing.length > 10 ? "…" : ""})`
        : " ✅")
  );

  if (stillMissing.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("[fill-gaps] Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
