import Link from "next/link";
import type { TransactionSummary } from "@/lib/api";
import { shortenHash, timeAgo } from "@/lib/format";
import { LayersIcon } from "./icons";

/**
 * Dedicated table for Arbitrum-style L1<->L2 sync transactions
 * (txType "0x6a"). Deliberately does NOT reuse TxTable's From/To
 * columns — those are meaningless here (from == to == the system
 * address on every row).
 *
 * UI is built for the END STATE (Block / L1 Tx / L2 Tx, matching
 * Arbiscan's txsDeposits layout) even though the backend doesn't
 * populate `l1TxHash` yet — see docs/BACKEND_TODO.md for exactly
 * what's needed. Until then, the L1 Tx cell renders a muted
 * "Not indexed yet" placeholder instead of breaking or lying about
 * having data.
 */
export function L1L2Table({
  transactions,
  viewAllHref,
}: {
  transactions: TransactionSummary[];
  viewAllHref?: string;
}) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        No L1↔L2 messages indexed yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="h-10 whitespace-nowrap bg-surface text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Block</th>
              <th className="px-4 py-2.5 font-semibold">L1 Tx</th>
              <th className="px-4 py-2.5 font-semibold">L2 Tx</th>
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
                <td className="px-4 py-2.5">
                  <Link
                    href={`/block/${tx.blockNumber}`}
                    className="group/link flex items-center gap-2"
                  >
                    <LayersIcon size={24} className="hidden shrink-0 text-lime sm:inline-block" />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm font-medium text-lime group-hover/link:underline">
                        <span className="sm:hidden">#</span>
                        {Number(tx.blockNumber).toLocaleString()}
                      </span>
                      {tx.block && (
                        <span className="text-xs text-muted">{timeAgo(tx.block.timestamp)}</span>
                      )}
                    </span>
                  </Link>
                </td>

                <td className="px-4 py-2.5 font-mono">
                  {tx.l1TxHash ? (
                    <a
                      href={`https://etherscan.io/tx/${tx.l1TxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-lime hover:underline"
                    >
                      {shortenHash(tx.l1TxHash, 3)}
                    </a>
                  ) : (
                    <span className="text-sm italic text-muted/60" title="Backend doesn't index this yet">
                      Not indexed yet
                    </span>
                  )}
                  {tx.block?.l1BlockNumber && (
                    <span className="mt-0.5 block text-xs text-muted">
                      L1 #{Number(tx.block.l1BlockNumber).toLocaleString()}
                    </span>
                  )}
                </td>

                <td className="px-4 py-2.5 font-mono">
                  <Link href={`/tx/${tx.hash}`} className="text-sm font-medium text-lime hover:underline">
                    {shortenHash(tx.hash, 3)}
                  </Link>
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
          View all L1↔L2 messages →
        </Link>
      )}
    </div>
  );
}
