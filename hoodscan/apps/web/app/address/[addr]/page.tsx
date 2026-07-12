import { notFound } from "next/navigation";
import { getTransactionsByAddress } from "@/lib/api";
import { TxTable } from "@/components/TxTable";

export const revalidate = 5;

export default async function AddressPage({
  params,
}: {
  params: { addr: string };
}) {
  const data = await getTransactionsByAddress(params.addr);

  if (!data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Address
        </h1>
        <p className="break-all font-mono text-sm text-muted">{data.address}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Transactions ({data.total})
        </h2>
        <TxTable transactions={data.transactions} />
      </div>
    </div>
  );
}
