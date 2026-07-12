import { rpcClient } from "../rpc/client";
import { hexToBigInt } from "../rpc/decoder";
import { markBlocksFinalizedUpTo } from "../services/blockService";

/**
 * Fetch the current "finalized" block tag and mark every indexed
 * block up to that number as finalized. This reflects L1 consensus
 * finality (~2 Ethereum epochs, observed as ~15 minutes / ~9,200
 * blocks behind "latest" on Robinhood Chain) — distinct from the
 * 7-day Arbitrum withdrawal challenge period, which is tracked
 * separately per-withdrawal, not per-block.
 */
export async function pollFinalizedBlock(): Promise<bigint | null> {
  const raw = (await rpcClient.request({
    method: "eth_getBlockByNumber",
    params: ["finalized", false],
  })) as { number: string } | null;

  if (!raw) return null;

  const finalizedNumber = hexToBigInt(raw.number);
  await markBlocksFinalizedUpTo(finalizedNumber);

  return finalizedNumber;
}
