import { notFound } from "next/navigation";
import { getBlockByNumber } from "@/lib/api";
import { TxTable } from "@/components/TxTable";
import { timeAgo } from "@/lib/format";

export const revalidate = 30;

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className="break-all text-right font-mono text-sm text-ink">{value}</span>
    </div>
  );
}

export default async function BlockPage({
  params,
}: {
  params: { number: string };
}) {
  const block = await getBlockByNumber(params.number);

  if (!block) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Block #{block.number}
        </h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            block.isFinalized
              ? "bg-lime/15 text-lime"
              : "bg-muted/15 text-muted"
          }`}
        >
          {block.isFinalized ? "Finalized" : "Pending"}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-surface px-4">
        <DetailRow label="Timestamp" value={`${timeAgo(block.timestamp)}`} />
        <DetailRow label="Hash" value={block.hash} />
        <DetailRow label="Parent hash" value={block.parentHash} />
        <DetailRow label="Transactions" value={block.txCount} />
        <DetailRow label="Gas used" value={block.gasUsed} />
        <DetailRow label="Gas limit" value={block.gasLimit} />
        <DetailRow label="Base fee per gas" value={block.baseFeePerGas} />
        <DetailRow
          label="L1 checkpoint block"
          value={block.l1BlockNumber}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Transactions ({block.transactions.length})
        </h2>
        <TxTable transactions={block.transactions} />
      </div>
    </div>
  );
}
