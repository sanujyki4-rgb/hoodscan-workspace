const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface BlockSummary {
  number: string;
  hash: string;
  timestamp: string;
  txCount: number;
  gasUsed: string;
  isFinalized: boolean;
}

export interface TransactionSummary {
  hash: string;
  blockNumber: string;
  transactionIndex: number;
  fromAddress: string;
  toAddress: string | null;
  value: string;
  txType: string;
  functionSelector: string | null;
}

export interface TransactionDetail extends TransactionSummary {
  txTypeLabel: string;
  gas: string;
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  input: string;
  block: {
    number: string;
    timestamp: string;
    isFinalized: boolean;
  };
}

export interface BlockDetail extends BlockSummary {
  parentHash: string;
  gasLimit: string;
  baseFeePerGas: string;
  l1BlockNumber: string;
  transactions: TransactionSummary[];
}

async function apiFetch<T>(path: string, revalidate = 5): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[api] Failed to fetch ${path}:`, err);
    return null;
  }
}

export function getLatestBlocks(limit = 20) {
  return apiFetch<BlockSummary[]>(`/blocks?limit=${limit}`, 2);
}

export function getBlockByNumber(number: string) {
  return apiFetch<BlockDetail>(`/blocks/${number}`, 30);
}

export function getTransactionByHash(hash: string) {
  return apiFetch<TransactionDetail>(`/transactions/${hash}`, 15);
}

export function getTransactionsByAddress(address: string, limit = 20, offset = 0) {
  return apiFetch<{
    address: string;
    total: number;
    limit: number;
    offset: number;
    transactions: TransactionSummary[];
  }>(`/address/${address}/transactions?limit=${limit}&offset=${offset}`, 5);
}
