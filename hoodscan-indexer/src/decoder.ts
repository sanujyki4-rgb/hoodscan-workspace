/**
 * Kept logically identical to hoodscan/apps/indexer/src/rpc/decoder.ts
 * on purpose — same raw RPC shape, same decoding rules. If you change
 * decoding logic here, consider whether hoodscan's indexer needs the
 * same fix (see docs/PLAN.md section 4).
 */

export interface RawTransaction {
  hash: string;
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
}

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
  transactions: RawTransaction[];
}

export function hexToBigInt(hex: string | null | undefined): bigint {
  if (!hex) return 0n;
  return BigInt(hex);
}

export function hexToNumber(hex: string | null | undefined): number {
  if (!hex) return 0;
  return Number(BigInt(hex));
}

export function hexToDate(hex: string): Date {
  return new Date(hexToNumber(hex) * 1000);
}

export function extractFunctionSelector(input: string): string | null {
  if (!input || input === "0x" || input.length < 10) return null;
  return input.slice(0, 10);
}

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

export interface DecodedTransaction {
  hash: string;
  blockNumber: bigint;
  transactionIndex: number;
  fromAddress: string;
  toAddress: string | null;
  nonce: bigint;
  value: string;
  gas: bigint;
  gasPrice: string | null;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  input: string;
  functionSelector: string | null;
  txType: string;
}

export function decodeBlock(raw: RawBlock): DecodedBlock {
  return {
    number: hexToBigInt(raw.number),
    hash: raw.hash,
    parentHash: raw.parentHash,
    timestamp: hexToDate(raw.timestamp),
    gasUsed: hexToBigInt(raw.gasUsed),
    gasLimit: hexToBigInt(raw.gasLimit),
    baseFeePerGas: hexToBigInt(raw.baseFeePerGas),
    l1BlockNumber: hexToBigInt(raw.l1BlockNumber),
    sendCount: hexToBigInt(raw.sendCount),
    sendRoot: raw.sendRoot,
    size: hexToNumber(raw.size),
    txCount: raw.transactions.length,
  };
}

export function decodeTransaction(raw: RawTransaction): DecodedTransaction {
  return {
    hash: raw.hash,
    blockNumber: hexToBigInt(raw.blockNumber),
    transactionIndex: hexToNumber(raw.transactionIndex),
    fromAddress: raw.from,
    toAddress: raw.to,
    nonce: hexToBigInt(raw.nonce),
    value: hexToBigInt(raw.value).toString(),
    gas: hexToBigInt(raw.gas),
    gasPrice: raw.gasPrice ? hexToBigInt(raw.gasPrice).toString() : null,
    maxFeePerGas: raw.maxFeePerGas ? hexToBigInt(raw.maxFeePerGas).toString() : null,
    maxPriorityFeePerGas: raw.maxPriorityFeePerGas
      ? hexToBigInt(raw.maxPriorityFeePerGas).toString()
      : null,
    input: raw.input,
    functionSelector: extractFunctionSelector(raw.input),
    txType: raw.type,
  };
}
