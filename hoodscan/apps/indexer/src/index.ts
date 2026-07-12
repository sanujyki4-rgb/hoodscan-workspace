import { INDEXER_POLL_INTERVAL_MS } from "@hoodscan/config";
import { pollLatestBlock } from "./jobs/pollLatestBlock";
import { pollFinalizedBlock } from "./jobs/pollFinalizedBlock";
import { backfillBlocks } from "./jobs/backfillBlocks";

let isPolling = false;

async function pollLoop() {
  // Guard against overlapping runs if a poll takes longer than the interval.
  if (isPolling) return;
  isPolling = true;

  try {
    const blockNumber = await pollLatestBlock();
    if (blockNumber !== null) {
      console.log(`[indexer] Indexed block ${blockNumber}`);
    }
  } catch (err) {
    console.error("[indexer] pollLatestBlock failed:", err);
  }

  try {
    await pollFinalizedBlock();
  } catch (err) {
    console.error("[indexer] pollFinalizedBlock failed:", err);
  }

  isPolling = false;
}

async function main() {
  console.log("[indexer] Starting hoodscan indexer...");

  // Catch up on any blocks missed while the indexer was offline.
  try {
    await backfillBlocks({ concurrency: 5 });
  } catch (err) {
    console.error("[indexer] Initial backfill failed:", err);
  }

  console.log(
    `[indexer] Entering poll loop (every ${INDEXER_POLL_INTERVAL_MS}ms)...`
  );
  setInterval(pollLoop, INDEXER_POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[indexer] Fatal error:", err);
  process.exit(1);
});
