import Link from "next/link";
import type { TransactionSummary } from "@/lib/api";
import {
  shortenHash,
  weiToEth,
  timeAgo,
  methodLabel,
  approxTxnFeeEth,
} from "@/lib/format";
import { CopyIconButton } from "./CopyIconButton";

/** From/To cell: hash + copy; profile address not clickable. */
function PartyAddress({
  value,
  isSelf,
}: {
  value: string;
  isSelf: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {isSelf ? (
        <span className="cursor-text font-medium text-ink" title={value}>
          {shortenHash(value, 4)}
        </span>
      ) : (
        <Link
          href={`/address/${value}`}
          className="text-muted hover:text-lime"
          title={value}
        >
          {shortenHash(value, 4)}
        </Link>
      )}
      <CopyIconButton value={value} label="Copy address" />
    </span>
  );
}

/**
 * Address-context transaction table (Arbiscan-style Transactions tab).
 * Font: no `font-mono` (see BlocksTable.tsx for why). Block/Amount/
 * Txn Fee/Age are the pure-number columns and carry `.nums`
 * (globals.css); hashes/addresses don't need it.
 */
export function AddressTxTable({
  address,
  transactions,
}: {
  address: string;
  transactions: TransactionSummary[];
}) {
  const addr = address.toLowerCase();

  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        No transactions found for this address in the indexed range.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="h-10 whitespace-nowrap bg-surface text-[11px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Txn Hash</th>
              <th className="px-4 py-2.5 font-semibold">Method</th>
              <th className="px-4 py-2.5 font-semibold">Block</th>
              <th className="px-4 py-2.5 font-semibold">Age</th>
              <th className="px-4 py-2.5 font-semibold">From</th>
              <th className="px-3 py-2.5 font-semibold" />
              <th className="px-4 py-2.5 font-semibold">To</th>
              <th className="px-4 py-2.5 font-semibold">Amount</th>
              <th className="px-4 py-2.5 font-semibold">Txn Fee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx, i) => {
              const from = tx.fromAddress.toLowerCase();
              const to = (tx.toAddress ?? "").toLowerCase();
              const isOut = from === addr;
              const isIn = to === addr;
              const direction =
                isOut && isIn ? "SELF" : isOut ? "OUT" : isIn ? "IN" : "—";
              const fee = approxTxnFeeEth(tx.gas, tx.gasPrice, tx.maxFeePerGas);

              return (
                <tr
                  key={tx.hash}
                  className={`group h-[52px] whitespace-nowrap border-l-2 border-l-transparent transition hover:border-l-lime-bright hover:bg-lime-bright/[0.03] ${
                    i % 2 === 1 ? "bg-surface/40" : ""
                  }`}
                >
                  <td className="px-4 py-2.5 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="font-medium text-lime hover:underline"
                      >
                        {shortenHash(tx.hash, 4)}
                      </Link>
                      <CopyIconButton value={tx.hash} label="Copy txn hash" />
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <span className="rounded-md bg-muted/10 px-1.5 py-0.5 text-sm text-ink">
                      {methodLabel(tx.functionSelector, tx.txType)}
                    </span>
                  </td>
                  <td className="nums px-4 py-2.5 text-sm">
                    <Link
                      href={`/block/${tx.blockNumber}`}
                      className="font-medium text-lime hover:underline"
                    >
                      {tx.blockNumber}
                    </Link>
                  </td>
                  <td className="nums px-4 py-2.5 text-sm text-muted">
                    {tx.block?.timestamp ? timeAgo(tx.block.timestamp) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <PartyAddress value={tx.fromAddress} isSelf={isOut} />
                  </td>
                  <td className="px-1 py-2.5 text-center">
                    <span
                      className={`inline-block min-w-[2.5rem] rounded px-1.5 py-0.5 text-center text-sm font-medium tracking-wide ${
                        direction === "IN"
                          ? "bg-lime/15 text-lime"
                          : direction === "OUT"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted/15 text-muted"
                      }`}
                    >
                      {direction}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    {!tx.toAddress ? (
                      <span className="text-sm text-muted">Contract Creation</span>
                    ) : (
                      <PartyAddress value={tx.toAddress} isSelf={isIn} />
                    )}
                  </td>
                  <td className="nums px-4 py-2.5 text-sm text-ink">
                    {weiToEth(tx.value, 6)} ETH
                  </td>
                  <td
                    className="nums px-4 py-2.5 text-sm text-muted"
                    title="Approx. gas × gas price (gas used not indexed yet)"
                  >
                    {fee !== null ? `${fee} ETH` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
