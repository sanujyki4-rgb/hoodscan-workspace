import { notFound } from "next/navigation";
import Link from "next/link";
import { getTransactionByHash } from "@/lib/api";
import { weiToEth, timeAgo } from "@/lib/format";

export const revalidate = 15;

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span className="break-all text-right font-mono text-sm text-ink">{value}</span>
    </div>
  );
}

export default async function TransactionPage({
  params,
}: {
  params: { hash: string };
}) {
  const tx = await getTransactionByHash(params.hash);

  if (!tx) notFound();

  const isSystemTx = tx.txType === "0x6a";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Transaction
        </h1>
        <div className="flex items-center gap-2">
          {isSystemTx && (
            <span className="rounded-full bg-muted/10 px-2.5 py-1 text-xs font-medium text-muted">
              System tx (L1↔L2 sync)
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              tx.block.isFinalized
                ? "bg-finalized/10 text-finalized"
                : "bg-pending/10 text-pending"
            }`}
          >
            {tx.block.isFinalized ? "Finalized" : "Pending"}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-panel px-4">
        <DetailRow label="Hash" value={tx.hash} />
        <DetailRow
          label="Block"
          value={
            <Link href={`/block/${tx.blockNumber}`} className="text-accent hover:underline">
              #{tx.blockNumber}
            </Link>
          }
        />
        <DetailRow label="Timestamp" value={timeAgo(tx.block.timestamp)} />
        <DetailRow label="Type" value={tx.txTypeLabel} />
        <DetailRow
          label="From"
          value={
            <Link href={`/address/${tx.fromAddress}`} className="text-accent hover:underline">
              {tx.fromAddress}
            </Link>
          }
        />
        <DetailRow
          label="To"
          value={
            tx.toAddress ? (
              <Link href={`/address/${tx.toAddress}`} className="text-accent hover:underline">
                {tx.toAddress}
              </Link>
            ) : (
              <span className="text-muted">Contract creation</span>
            )
          }
        />
        <DetailRow label="Value" value={`${weiToEth(tx.value)} ETH`} />
        <DetailRow label="Gas" value={tx.gas} />
        {tx.gasPrice && <DetailRow label="Gas price" value={tx.gasPrice} />}
        {tx.maxFeePerGas && <DetailRow label="Max fee per gas" value={tx.maxFeePerGas} />}
        {tx.functionSelector && (
          <DetailRow label="Function selector" value={tx.functionSelector} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Input data
        </h2>
        <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-panel px-4 py-3 font-mono text-xs text-muted">
          {tx.input}
        </pre>
      </div>
    </div>
  );
}
