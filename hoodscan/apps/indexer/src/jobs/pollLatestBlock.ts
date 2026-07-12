import { rpcClient } from "../rpc/client";
import { decodeBlock, decodeTransaction } from "../rpc/decoder";
import { saveBlock } from "../services/blockService";
import { saveTransactions } from "../services/transactionService";
import type { RawBlock, RawTransaction } from "@hoodscan/types";

/**
 * Fetch the latest block (with full transaction objects) and persist
 * it along with all its transactions. Returns the indexed block
 * number, or null if the block was already indexed (no-op).
 */
export async function pollLatestBlock(): Promise<bigint | null> {
  // includeTransactions=true avoids a second round-trip per tx hash —
  // see the design note from our earlier RPC exploration.
  const raw = (await rpcClient.request({
    method: "eth_getBlockByNumber",
    params: ["latest", true],
  })) as unknown as RawBlock;

  if (!raw) return null;

  const block = decodeBlock(raw);
  await saveBlock(block);

  const rawTxs = raw.transactions as RawTransaction[];
  const decodedTxs = rawTxs.map(decodeTransaction);
  await saveTransactions(decodedTxs);

  return block.number;
}
