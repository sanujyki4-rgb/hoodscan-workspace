import Link from "next/link";
import type { BlockSummary } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { GasBar } from "./GasBar";
import { BlockIcon } from "./icons";

export function BlocksTable({
  blocks,
  viewAllHref,
}: {
  blocks: BlockSummary[];
  viewAllHref?: string;
}) {
  if (blocks.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        No blocks indexed yet.
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
              <th className="px-4 py-2.5 font-semibold">Txns</th>
              <th className="px-4 py-2.5 font-semibold">Gas usage</th>
              <th className="px-4 py-2.5 text-right font-semibold">Status</th>
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
                <td className="px-4 py-2.5">
                  <Link href={`/block/${block.number}`} className="group/link flex items-center gap-2">
                    <BlockIcon size={24} className="hidden shrink-0 text-lime sm:inline-block" />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm font-medium text-lime group-hover/link:underline">
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
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-sm text-ink">
                  <span className="rounded-md bg-muted/10 px-1.5 py-0.5 font-mono tabular-nums">
                    {block.txCount}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">
                  <GasBar used={block.gasUsed} limit={block.gasLimit} />
                </td>
                <td className="px-4 py-2.5 text-right">
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
