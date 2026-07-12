/**
 * Shape of a transaction object as returned by the Robinhood Chain
 * JSON-RPC endpoint when a block is fetched with the "include full
 * transactions" flag (eth_getBlockByNumber params: [blockTag, true]).
 * All numeric fields arrive as hex strings.
 */
export interface RawTransaction {
  hash: string;
  blockHash: string;
  blockNumber: string;
  transactionIndex: string;
  from: string;
  to: string | null;
  nonce: string;
  value: string;
  input: string;
  gas: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  type: string;
  chainId?: string;
  v?: string;
  r?: string;
  s?: string;
  accessList?: unknown[];
}

/**
 * Decoded transaction, ready to persist via packages/database.
 */
export interface DecodedTransaction {
  hash: string;
  blockNumber: bigint;
  transactionIndex: number;
  fromAddress: string;
  toAddress: string | null;
  nonce: bigint;
  value: string; // kept as string to preserve full wei precision
  gas: bigint;
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  input: string;
  functionSelector: string | null; // first 4 bytes of input, e.g. "0x095ea7b3"
  txType: string; // "0x0", "0x2", "0x6a" (Arbitrum system tx), etc.
}

/**
 * Known Arbitrum/Robinhood Chain transaction types worth labeling
 * distinctly in the UI, based on what we've observed on mainnet.
 */
export const TX_TYPE_LABELS: Record<string, string> = {
  "0x0": "Legacy",
  "0x2": "EIP-1559",
  "0x6a": "System (L1↔L2 sync)",
};
