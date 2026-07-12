import Link from "next/link";
import type { TransactionSummary } from "@/lib/api";
import { shortenHash, weiToEth, txTypeLabel } from "@/lib/format";

const SYSTEM_TX_SUFFIX = "0a4b05";

function isSystemTx(tx: TransactionSummary): boolean {
  return tx.fromAddress.toLowerCase().endsWith(SYSTEM_TX_SUFFIX);
}

export function TxTable({ transactions }: { transactions: TransactionSummary[] }) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-panel px-4 py-6 text-center text-sm text-muted">
        No transactions to show.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-panel text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">Hash</th>
            <th className="px-4 py-2 font-medium">Type</th>
            <th className="px-4 py-2 font-medium">From</th>
            <th className="px-4 py-2 font-medium">To</th>
            <th className="px-4 py-2 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((tx) => (
            <tr key={tx.hash} className="hover:bg-panel/60">
              <td className="px-4 py-2.5 font-mono">
                <Link href={`/tx/${tx.hash}`} className="text-accent hover:underline">
                  {shortenHash(tx.hash)}
                </Link>
              </td>
              <td className="px-4 py-2.5">
                {isSystemTx(tx) ? (
                  <span className="rounded bg-muted/10 px-1.5 py-0.5 text-xs text-muted">
                    System
                  </span>
                ) : (
                  <span className="text-xs text-muted">{txTypeLabel(tx.txType)}</span>
                )}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                <Link href={`/address/${tx.fromAddress}`} className="hover:text-accent">
                  {shortenHash(tx.fromAddress, 4)}
                </Link>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs">
                {tx.toAddress ? (
                  <Link href={`/address/${tx.toAddress}`} className="hover:text-accent">
                    {shortenHash(tx.toAddress, 4)}
                  </Link>
                ) : (
                  <span className="text-muted">Contract creation</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-xs">
                {weiToEth(tx.value)} ETH
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
