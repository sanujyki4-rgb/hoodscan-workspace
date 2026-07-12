import { prisma } from "@hoodscan/database";
import type { DecodedBlock } from "@hoodscan/types";

/**
 * Insert a block if it doesn't already exist. Idempotent — safe to
 * call repeatedly for the same block (e.g. if a polling cycle overlaps).
 */
export async function saveBlock(block: DecodedBlock) {
  return prisma.block.upsert({
    where: { number: block.number },
    update: {}, // block data never changes once mined; no-op on conflict
    create: {
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
      baseFeePerGas: block.baseFeePerGas,
      l1BlockNumber: block.l1BlockNumber,
      sendCount: block.sendCount,
      sendRoot: block.sendRoot,
      size: block.size,
      txCount: block.txCount,
    },
  });
}

/**
 * Return the highest block number we've indexed so far, or null if
 * the database is empty (fresh install — indexer should start from
 * the current chain head or run a backfill).
 */
export async function getLatestIndexedBlockNumber(): Promise<bigint | null> {
  const latest = await prisma.block.findFirst({
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return latest?.number ?? null;
}

/**
 * Mark all blocks up to and including `finalizedNumber` as finalized.
 * Called after each poll of the "finalized" block tag.
 */
export async function markBlocksFinalizedUpTo(finalizedNumber: bigint) {
  return prisma.block.updateMany({
    where: {
      number: { lte: finalizedNumber },
      isFinalized: false,
    },
    data: { isFinalized: true },
  });
}
