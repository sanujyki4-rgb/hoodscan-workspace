import "dotenv/config";
import { prisma } from "./db";
import { getRpcClient, rpcClientCount } from "./rpc";
import { decodeBlock, decodeTransaction, type RawBlock, type RawTransaction } from "./decoder";

const CONCURRENCY = Number(process.env.BACKFILL_CONCURRENCY ?? 15);
const BATCH_SIZE = Number(process.env.BACKFILL_BATCH_SIZE ?? 200);
const MAX_RPS = Number(process.env.RPC_MAX_REQUESTS_PER_SECOND ?? 20);
const FETCH_MAX_ATTEMPTS = Number(process.env.RPC_FETCH_MAX_ATTEMPTS ?? 8);

// Minimum time one "window" of CONCURRENCY requests must take, so
// sustained throughput never exceeds MAX_RPS — even if every request
// in the window happens to resolve instantly.
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

const PROGRESS_ID = "main";

// ── Checkpoint helpers ──────────────────────────────────────────

async function getCheckpoint(): Promise<bigint> {
  const progress = await prisma.backfillProgress.upsert({
    where: { id: PROGRESS_ID },
    update: {},
    create: { id: PROGRESS_ID, lastIndexedBlock: -1n },
  });
  return progress.lastIndexedBlock;
}

async function saveCheckpoint(blockNumber: bigint, targetBlock: bigint) {
  await prisma.backfillProgress.update({
    where: { id: PROGRESS_ID },
    data: { lastIndexedBlock: blockNumber, targetBlock },
  });
}

// ── Fetch + decode a single block (with full tx objects) ───────

async function fetchBlock(blockNumber: bigint): Promise<{
  block: ReturnType<typeof decodeBlock>;
  transactions: ReturnType<typeof decodeTransaction>[];
} | null> {
  const hex = "0x" + blockNumber.toString(16);

  // Round-robin a fresh client every call so load spreads across keys.
  const raw = (await getRpcClient().request({
    method: "eth_getBlockByNumber",
    params: [hex, true],
  })) as unknown as RawBlock;

  if (!raw) return null;

  const block = decodeBlock(raw);
  const transactions = (raw.transactions as RawTransaction[]).map(decodeTransaction);

  return { block, transactions };
}

/**
 * Retry retriable failures (especially 429) with exponential backoff.
 * Previously a single 429 permanently skipped the block and left a hole.
 */
async function fetchBlockWithRetry(blockNumber: bigint): Promise<{
  block: ReturnType<typeof decodeBlock>;
  transactions: ReturnType<typeof decodeTransaction>[];
} | null> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchBlock(blockNumber);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retriable = isRetriableError(err);

      if (!retriable || attempt === FETCH_MAX_ATTEMPTS) {
        break;
      }

      // 500ms, 1s, 2s, 4s, ... capped at 20s
      const delayMs = Math.min(20_000, 500 * 2 ** (attempt - 1));
      console.warn(
        `[backfill] block ${blockNumber} attempt ${attempt}/${FETCH_MAX_ATTEMPTS} failed, ` +
          `retry in ${delayMs}ms — ${msg.split("\n")[0]}`
      );
      await sleep(delayMs);
    }
  }

  throw lastErr;
}

// ── Bulk write a batch of fetched blocks to Postgres ────────────

async function flushBatch(
  batch: { block: ReturnType<typeof decodeBlock>; transactions: ReturnType<typeof decodeTransaction>[] }[]
) {
  if (batch.length === 0) return;

  const blocks = batch.map((b) => b.block);
  const transactions = batch.flatMap((b) => b.transactions);

  // createMany + skipDuplicates: safe to re-run over an already
  // partially-written range after a crash/restart.
  await prisma.block.createMany({ data: blocks, skipDuplicates: true });
  if (transactions.length > 0) {
    await prisma.transaction.createMany({ data: transactions, skipDuplicates: true });
  }
}

// ── Main backfill loop ──────────────────────────────────────────

async function main() {
  const headHex = (await getRpcClient().request({
    method: "eth_blockNumber",
    params: [],
  })) as string;
  const chainHead = BigInt(headHex);

  const checkpoint = await getCheckpoint();
  const startBlock = checkpoint + 1n; // -1n initial checkpoint -> start at 0

  if (startBlock > chainHead) {
    console.log(`[backfill] Already caught up to chain head (${chainHead}).`);
    return;
  }

  console.log(
    `[backfill] Starting from block ${startBlock} toward chain head ${chainHead} ` +
      `(${(chainHead - startBlock).toLocaleString()} blocks remaining), ` +
      `concurrency=${CONCURRENCY}, batchSize=${BATCH_SIZE}, maxRps=${MAX_RPS}, ` +
      `rpcEndpoints=${rpcClientCount}, fetchAttempts=${FETCH_MAX_ATTEMPTS}`
  );

  let current = startBlock;
  let batch: NonNullable<Awaited<ReturnType<typeof fetchBlock>>>[] = [];
  const startTime = Date.now();
  let processedCount = 0;

  while (current <= chainHead) {
    const windowStartedAt = Date.now();
    const windowEnd = current + BigInt(CONCURRENCY) - 1n;
    const blockNumbers: bigint[] = [];
    for (let n = current; n <= windowEnd && n <= chainHead; n++) {
      blockNumbers.push(n);
    }

    // Fetch window in parallel, but never silently drop a block on 429 —
    // fetchBlockWithRetry backs off; hard failures stop the process.
    const results = await Promise.all(
      blockNumbers.map(async (n) => {
        try {
          return await fetchBlockWithRetry(n);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[backfill] Failed to fetch block ${n} after retries:`, msg);
          throw new Error(
            `Block ${n} failed after ${FETCH_MAX_ATTEMPTS} attempts. ` +
              `Lower BACKFILL_CONCURRENCY / RPC_MAX_REQUESTS_PER_SECOND and re-run. ` +
              `Last error: ${msg.split("\n")[0]}`
          );
        }
      })
    );

    for (const r of results) {
      if (r) batch.push(r);
    }

    processedCount += blockNumbers.length;
    current = windowEnd + 1n;

    // Pace ourselves: if this window resolved faster than it should
    // have (given MAX_RPS), wait out the remainder before firing the
    // next window. This is what actually enforces the rate limit —
    // relying on natural request latency alone isn't safe.
    const windowElapsedMs = Date.now() - windowStartedAt;
    if (windowElapsedMs < MIN_WINDOW_MS) {
      await sleep(MIN_WINDOW_MS - windowElapsedMs);
    }

    if (batch.length >= BATCH_SIZE || current > chainHead) {
      await flushBatch(batch);
      const lastInBatch = current - 1n;
      await saveCheckpoint(lastInBatch, chainHead);
      batch = [];

      const elapsedSec = (Date.now() - startTime) / 1000;
      const rate = processedCount / elapsedSec;
      const remaining = chainHead - current;
      const etaSec = rate > 0 ? Number(remaining) / rate : 0;

      console.log(
        `[backfill] Checkpoint @ ${lastInBatch} | ` +
          `${rate.toFixed(1)} blocks/sec | ` +
          `ETA ${(etaSec / 3600).toFixed(1)}h`
      );
    }
  }

  console.log(`[backfill] Done. Caught up to block ${chainHead}.`);
}

// Save progress on Ctrl+C instead of losing the in-memory batch silently.
process.on("SIGINT", () => {
  console.log("\n[backfill] Interrupted — last saved checkpoint is safe to resume from.");
  process.exit(0);
});

main()
  .catch((err) => {
    console.error("[backfill] Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
