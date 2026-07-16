import Link from "next/link";
import type { TransactionSummary } from "@/lib/api";
import { shortenHash, weiToEth, methodLabel, approxTxnFeeEth, timeAgo } from "@/lib/format";
import { TxIcon } from "./icons";

// System txs are identified by txType "0x6a" (Arbitrum-style ArbOS
// internal housekeeping) — same source of truth used by the backend
// controller and L1L2Table. methodLabel() already folds this in, so
// this table doesn't need its own separate check anymore.

/**
 * Font: no `font-mono` (see BlocksTable.tsx for why). "Amount" and
 * "Max fee" are the pure-number columns here, so they're the ones
 * carrying the `.nums` utility (globals.css) — Tx/From/To are
 * hashes/addresses, which are truncated already and don't need
 * figure styling or column alignment.
 */
export function TxTable({
  transactions,
  variant = "compact",
  viewAllHref,
}: {
  transactions: TransactionSummary[];
  /**
   * "compact" (homepage): Tx / From / To / Amount — method + age
   *   stacked as a secondary line under the hash, to fit the narrow
   *   3-up grid.
   * "detailed" (/transactions, block detail page): Tx / Method /
   *   Block / Age / From / To / Amount / Max fee — matches Arbiscan's
   *   transaction list column set and ordering.
   */
  variant?: "compact" | "detailed";
  viewAllHref?: string;
}) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        No transactions to show.
      </p>
    );
  }

  const isDetailed = variant === "detailed";

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="h-10 whitespace-nowrap bg-surface text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Tx</th>
              {isDetailed && <th className="px-4 py-2.5 font-semibold">Method</th>}
              {isDetailed && <th className="px-4 py-2.5 font-semibold">Block</th>}
              {isDetailed && <th className="px-4 py-2.5 font-semibold">Age</th>}
              <th className="px-4 py-2.5 font-semibold">From</th>
              <th className="px-4 py-2.5 font-semibold">To</th>
              <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
              {isDetailed && <th className="px-4 py-2.5 text-right font-semibold">Max fee</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx, i) => {
              const method = methodLabel(tx.functionSelector, tx.txType, tx.value);
              const maxFee = isDetailed
                ? approxTxnFeeEth(tx.gas, tx.gasPrice, tx.maxFeePerGas)
                : null;

              return (
                <tr
                  key={tx.hash}
                  className={`group h-[52px] whitespace-nowrap border-l-2 border-l-transparent transition hover:border-l-lime-bright hover:bg-lime-bright/[0.03] ${
                    i % 2 === 1 ? "bg-surface/40" : ""
                  }`}
                >
                  {/* Column values: text-sm. Method + Age get their own
                      columns in "detailed"; stay stacked under the hash
                      in "compact" (homepage) to save width. */}
                  <td className="px-4 py-2.5 text-sm">
                    <Link href={`/tx/${tx.hash}`} className="group/link flex items-center gap-2">
                      <TxIcon size={24} className="shrink-0 text-lime" />
                      {isDetailed ? (
                        <span className="text-sm font-medium text-lime group-hover/link:underline">
                          {shortenHash(tx.hash, 3)}
                        </span>
                      ) : (
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-lime group-hover/link:underline">
                            {shortenHash(tx.hash, 3)}
                          </span>
                          {tx.block && (
                            <span className="text-xs text-muted">{timeAgo(tx.block.timestamp)}</span>
                          )}
                        </span>
                      )}
                    </Link>
                  </td>

                  {isDetailed && (
                    <td className="px-4 py-2.5 text-sm">
                      <span className="rounded-md bg-muted/10 px-1.5 py-0.5 font-mono text-xs text-ink">
                        {method}
                      </span>
                    </td>
                  )}

                  {isDetailed && (
                    <td className="px-4 py-2.5 text-sm">
                      <Link href={`/block/${tx.blockNumber}`} className="text-lime hover:underline">
                        #{tx.blockNumber}
                      </Link>
                    </td>
                  )}

                  {isDetailed && (
                    <td className="px-4 py-2.5 text-sm text-muted">
                      {tx.block ? timeAgo(tx.block.timestamp) : "—"}
                    </td>
                  )}

                  <td className="px-4 py-2.5 text-sm">
                    <Link href={`/address/${tx.fromAddress}`} className="text-sm text-muted hover:text-lime">
                      {shortenHash(tx.fromAddress, 3)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    {tx.toAddress ? (
                      <Link href={`/address/${tx.toAddress}`} className="text-sm text-muted hover:text-lime">
                        {shortenHash(tx.toAddress, 3)}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">Contract</span>
                    )}
                  </td>
                  <td className="nums px-4 py-2.5 text-right text-sm text-ink">
                    {weiToEth(tx.value, 4)}
                  </td>
                  {isDetailed && (
                    <td
                      className="nums px-4 py-2.5 text-right text-sm text-muted"
                      title="gas limit × max fee per gas — the most the sender allowed this tx to cost, not the actual amount charged (per-tx gas used isn't indexed yet)"
                    >
                      {maxFee ?? "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="block border-t border-border bg-surface px-4 py-2.5 text-center text-sm font-medium text-lime hover:bg-lime/5"
        >
          View all transactions →
        </Link>
      )}
    </div>
  );
}
