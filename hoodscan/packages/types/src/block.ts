import type { RawTransaction } from "./transaction";

/**
 * Shape of the raw block object as returned by the Robinhood Chain
 * JSON-RPC endpoint (eth_getBlockByNumber), before decoding.
 * All numeric fields arrive as hex strings.
 */
export interface RawBlock {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  gasUsed: string;
  gasLimit: string;
  baseFeePerGas: string;
  l1BlockNumber: string;
  sendCount: string;
  sendRoot: string;
  size: string;
  miner: string;
  // hash-only when fetched with [tag, false]; full objects when [tag, true]
  transactions: string[] | RawTransaction[];
  transactionsRoot: string;
  uncles: string[];
}

/**
 * Decoded block, ready to persist via packages/database.
 */
export interface DecodedBlock {
  number: bigint;
  hash: string;
  parentHash: string;
  timestamp: Date;
  gasUsed: bigint;
  gasLimit: bigint;
  baseFeePerGas: bigint;
  l1BlockNumber: bigint;
  sendCount: bigint;
  sendRoot: string;
  size: number;
  txCount: number;
}
