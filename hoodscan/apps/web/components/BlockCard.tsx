import Link from "next/link";
import type { BlockSummary } from "@/lib/api";
import { shortenHash, timeAgo } from "@/lib/format";

export function BlockCard({ block }: { block: BlockSummary }) {
  return (
    <Link
      href={`/block/${block.number}`}
      className="flex items-center justify-between rounded-lg border border-border bg-panel px-4 py-3 transition hover:border-accent"
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-sm font-medium text-accent">
          #{block.number}
        </span>
        <span className="text-xs text-muted">{timeAgo(block.timestamp)}</span>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span className="font-mono text-xs text-muted">
          {shortenHash(block.hash)}
        </span>
        <span className="text-xs text-muted">{block.txCount} txns</span>
      </div>

      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          block.isFinalized
            ? "bg-finalized/10 text-finalized"
            : "bg-pending/10 text-pending"
        }`}
      >
        {block.isFinalized ? "Finalized" : "Pending"}
      </span>
    </Link>
  );
}
