import Link from "next/link";
import type { TransactionSummary } from "@/lib/api";
import { shortenHash, weiToEth, txTypeLabel, timeAgo } from "@/lib/format";
import { TxIcon } from "./icons";

// System txs are identified by txType "0x6a" (Arbitrum-style L1<->L2
// sync messages) — same source of truth used by the backend controller
// and L1L2Table, so the "System" badge here always agrees with how
// these transactions are classified everywhere else in the app.
function isSystemTx(tx: TransactionSummary): boolean {
  return tx.txType === "0x6a";
}

export function TxTable({
  transactions,
  showAge = false,
  showType = true,
  viewAllHref,
}: {
  transactions: TransactionSummary[];
  showAge?: boolean;
  /**
   * Hide the tx-type label (Legacy/EIP-1559/System) on the secondary
   * line, leaving just the age. Used on the homepage's narrow 3-up
   * grid, where even "System · 17s ago" was long enough to overflow
   * the column. The full "All transactions" page has room to spare,
   * so it keeps showType at its default (true) and shows the label.
   */
  showType?: boolean;
  viewAllHref?: string;
}) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        No transactions to show.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="h-10 whitespace-nowrap bg-surface text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Tx</th>
              <th className="px-4 py-2.5 font-semibold">From</th>
              <th className="px-4 py-2.5 font-semibold">To</th>
              <th className="px-4 py-2.5 text-right font-semibold">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx, i) => (
              <tr
                key={tx.hash}
                className={`group h-[52px] whitespace-nowrap border-l-2 border-l-transparent transition hover:border-l-lime-bright hover:bg-lime-bright/[0.03] ${
                  i % 2 === 1 ? "bg-surface/40" : ""
                }`}
              >
                <td className="px-4 py-2.5 font-mono">
                  <Link href={`/tx/${tx.hash}`} className="group/link flex items-center gap-2">
                    <TxIcon size={24} className="shrink-0 text-lime" />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-lime group-hover/link:underline">
                        {shortenHash(tx.hash, 3)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        {(() => {
                          const label = showType ? (isSystemTx(tx) ? "System" : txTypeLabel(tx.txType)) : null;
                          const age = showAge && tx.block ? timeAgo(tx.block.timestamp) : null;
                          if (label && age) return `${label} · ${age}`;
                          return label ?? age;
                        })()}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-sm">
                  <Link href={`/address/${tx.fromAddress}`} className="text-muted hover:text-lime">
                    {shortenHash(tx.fromAddress, 3)}
                  </Link>
                </td>
                <td className="px-4 py-2.5 font-mono text-sm">
                  {tx.toAddress ? (
                    <Link href={`/address/${tx.toAddress}`} className="text-muted hover:text-lime">
                      {shortenHash(tx.toAddress, 3)}
                    </Link>
                  ) : (
                    <span className="text-muted">Contract</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-ink">
                  {weiToEth(tx.value, 4)}
                </td>
              </tr>
            ))}
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
