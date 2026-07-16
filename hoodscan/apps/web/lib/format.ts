/**
 * Formatting helpers shared across pages/components. Kept separate
 * from lib/api.ts so display logic doesn't leak into data-fetching code.
 */

import { TX_TYPE_LABELS } from "@hoodscan/types";
import type { BlockSummary } from "./api";

export function shortenHash(hash: string, chars = 6): string {
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}…${hash.slice(-chars)}`;
}

export function weiToEth(wei: string, decimals = 6): string {
  const value = BigInt(wei);
  const eth = Number(value) / 1e18;
  return eth.toFixed(decimals);
}

/**
 * Approximate txn fee in ETH from stored fields.
 * True fee is gasUsed × effectiveGasPrice; we only index gas (limit) + gasPrice/maxFee,
 * so this is gas × gasPrice (or maxFeePerGas) when available.
 */
export function approxTxnFeeEth(
  gas: string | undefined,
  gasPrice: string | null | undefined,
  maxFeePerGas?: string | null,
  decimals = 8
): string | null {
  if (!gas) return null;
  const price = gasPrice && gasPrice !== "0" ? gasPrice : maxFeePerGas;
  if (!price || price === "0") return null;
  try {
    const feeWei = BigInt(gas) * BigInt(price);
    const eth = Number(feeWei) / 1e18;
    if (eth === 0) return "0";
    if (eth < 1e-8) return eth.toExponential(2);
    return eth.toFixed(decimals).replace(/\.?0+$/, "");
  } catch {
    return null;
  }
}

export function timeAgo(isoTimestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoTimestamp).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function txTypeLabel(type: string): string {
  return TX_TYPE_LABELS[type] ?? type;
}

/**
 * Default Method column label (no curated selector map).
 * - System / L1↔L2 by tx type
 * - Empty calldata → Transfer
 * - Otherwise raw 4-byte selector (0x…)
 */
export function methodLabel(
  selector: string | null | undefined,
  txType?: string | null,
  _valueWei?: string | null
): string {
  if (txType === "0x6a") return "System";
  if (txType === "0x69") return "L1↔L2";

  const sel = (selector ?? "").trim().toLowerCase();
  if (!sel || sel === "0x") return "Transfer";

  return sel.length >= 10 ? sel.slice(0, 10) : sel;
}

/**
 * Average time between blocks, in milliseconds, measured across the
 * given (newest-first) block list. Returns 0 if there isn't enough
 * data to measure a span — callers decide how to display that (e.g.
 * fall back to "—").
 */
export function avgBlockTimeMs(blocks: BlockSummary[]): number {
  if (blocks.length < 2) return 0;
  const newest = new Date(blocks[0].timestamp).getTime();
  const oldest = new Date(blocks[blocks.length - 1].timestamp).getTime();
  return ((newest - oldest) / 1000 / (blocks.length - 1)) * 1000;
}
