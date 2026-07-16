import Link from "next/link";
import type { BlockSummary } from "@/lib/api";
import { shortenHash, timeAgo } from "@/lib/format";
import { BlockIcon } from "./icons";

function formatGasUsed(used: string, limit: string): string {
  const usedNum = Number(used);
  const limitNum = Number(limit);
  const pct = limitNum > 0 ? (usedNum / limitNum) * 100 : 0;
  const pctLabel =
    pct > 0 && pct < 0.5 ? "<1%" : pct < 10 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`;
  // Match explorer style: "155,930 (0%)"
  const pctDisplay = pct < 0.5 ? "0%" : pctLabel;
  return `${usedNum.toLocaleString("en-US")} (${pctDisplay})`;
}

function formatGasLimit(limit: string): string {
  return Number(limit).toLocaleString("en-US");
}

/**
 * Numbers and hashes here intentionally do NOT use `font-mono`
 * (IBM Plex Mono) anymore. A true monospace typeface forces every
 * character — including narrow ones — to the same advance width,
 * which reads noticeably bigger/heavier than a proportional font at
 * the same declared font-size (this is exactly why our text felt
 * larger than Arbiscan's despite Arbiscan's base font-size being
 * bigger on paper: they're not setting numbers in a monospace face).
 * Instead, plain number columns use the body font (Space Grotesk,
 * inherited) with the `.nums` utility (globals.css) — oldstyle +
 * tabular figures, so digits sit at lowercase height instead of full
 * cap-height (Space Grotesk's default) and still line up evenly in a
 * column. Hashes are truncated anyway (`0x5bb…54b`), so they don't
 * get either — they don't need column alignment or figure styling.
 */
export function BlocksTable({
  blocks,
  viewAllHref,
  variant = "compact",
}: {
  blocks: BlockSummary[];
  viewAllHref?: string;
  /**
   * "compact" (homepage): Block / Hash / Txns / L1 block
   * "detailed" (/blocks): Block / Hash / Txns / Gas used / Gas limit / Base fee / Status
   *   (L1 block omitted here — L1 context is covered on L1↔L2 messages pages)
   */
  variant?: "compact" | "detailed";
}) {
  if (blocks.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        No blocks indexed yet.
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
              <th className="px-4 py-2.5 font-semibold">Block</th>
              {isDetailed && <th className="px-4 py-2.5 font-semibold">Age</th>}
              <th className="px-4 py-2.5 font-semibold">Hash</th>
              <th className="px-4 py-2.5 font-semibold">Txns</th>
              {isDetailed && <th className="px-4 py-2.5 font-semibold">Gas used</th>}
              {isDetailed && <th className="px-4 py-2.5 font-semibold">Gas limit</th>}
              {isDetailed && <th className="px-4 py-2.5 font-semibold">Base fee</th>}
              {!isDetailed && <th className="px-4 py-2.5 font-semibold">L1 block</th>}
              {isDetailed && (
                <th className="px-4 py-2.5 text-right font-semibold">Status</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {blocks.map((block, i) => (
              <tr
                key={block.number}
                className={`group h-[52px] whitespace-nowrap border-l-2 border-l-transparent transition hover:border-l-lime-bright hover:bg-lime-bright/[0.03] ${
                  i % 2 === 1 ? "bg-surface/40" : ""
                }`}
              >
                {/* Column values: text-sm. Age gets its own column in
                    "detailed" (view-all); stays stacked under the block
                    number in "compact" (homepage) to save width. */}
                <td className="px-4 py-2.5 text-sm">
                  <Link href={`/block/${block.number}`} className="group/link flex items-center gap-2">
                    <BlockIcon size={24} className="hidden shrink-0 text-lime sm:inline-block" />
                    {isDetailed ? (
                      <span className="nums text-sm font-medium text-lime group-hover/link:underline">
                        {block.number}
                      </span>
                    ) : (
                      <span className="flex flex-col gap-0.5">
                        <span className="nums text-sm font-medium text-lime group-hover/link:underline">
                          <span className="sm:hidden">#</span>
                          {block.number}
                        </span>
                        <span
                          className="text-xs text-muted"
                          title={new Date(block.timestamp).toLocaleString()}
                        >
                          {timeAgo(block.timestamp)}
                        </span>
                      </span>
                    )}
                  </Link>
                </td>

                {isDetailed && (
                  <td
                    className="nums px-4 py-2.5 text-sm text-muted"
                    title={new Date(block.timestamp).toLocaleString()}
                  >
                    {timeAgo(block.timestamp)}
                  </td>
                )}

                <td className="px-4 py-2.5 text-sm">
                  <Link href={`/block/${block.number}`} className="text-muted hover:text-lime">
                    {shortenHash(block.hash, 4)}
                  </Link>
                </td>

                <td className="px-4 py-2.5 text-sm text-ink">
                  <span className="nums rounded-md bg-muted/10 px-1.5 py-0.5 text-sm">
                    {block.txCount}
                  </span>
                </td>

                {isDetailed && (
                  <td
                    className="nums px-4 py-2.5 text-sm text-muted"
                    title={`Gas used ${block.gasUsed} / limit ${block.gasLimit}`}
                  >
                    {formatGasUsed(block.gasUsed, block.gasLimit)}
                  </td>
                )}

                {isDetailed && (
                  <td className="nums px-4 py-2.5 text-sm text-muted">
                    {formatGasLimit(block.gasLimit)}
                  </td>
                )}

                {isDetailed && (
                  <td className="nums px-4 py-2.5 text-sm text-muted">
                    {(Number(block.baseFeePerGas) / 1e9).toFixed(3)} gwei
                  </td>
                )}

                {!isDetailed && (
                  <td className="nums px-4 py-2.5 text-sm text-muted">
                    <a
                      href={`https://etherscan.io/block/${block.l1BlockNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-lime"
                      title="View L1 block on Etherscan"
                    >
                      #{block.l1BlockNumber}
                    </a>
                  </td>
                )}

                {isDetailed && (
                  <td className="px-4 py-2.5 text-right text-sm">
                    <span
                      className={`rounded-full px-2 py-0.5 text-sm font-medium ${
                        block.isFinalized
                          ? "bg-lime/15 text-lime"
                          : "bg-muted/15 text-muted"
                      }`}
                    >
                      {block.isFinalized ? "Finalized" : "Pending"}
                    </span>
                  </td>
                )}
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
          View all blocks →
        </Link>
      )}
    </div>
  );
}
