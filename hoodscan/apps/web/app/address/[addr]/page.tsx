import { notFound } from "next/navigation";
import { getTransactionsByAddress } from "@/lib/api";
import { AddressTabs, parseAddressTab } from "@/components/AddressTabs";
import { AddressTxTable } from "@/components/AddressTxTable";
import { AddressTabPlaceholder } from "@/components/AddressTabPlaceholder";
import { Pagination } from "@/components/Pagination";

export const revalidate = 5;

const LIMIT = 25;

export default async function AddressPage({
  params,
  searchParams,
}: {
  params: { addr: string };
  searchParams: { tab?: string; page?: string };
}) {
  const tab = parseAddressTab(searchParams.tab);
  const page = Math.max(Number(searchParams.page) || 1, 1);
  const offset = (page - 1) * LIMIT;

  // Always load tx summary so the Transactions tab count is accurate even on other tabs.
  const data = await getTransactionsByAddress(
    params.addr,
    LIMIT,
    tab === "transactions" ? offset : 0
  );

  if (!data) notFound();

  const address = data.address.startsWith("0x") ? data.address : params.addr;

  return (
    <div className="flex flex-col gap-6">
      {/* Minimal header — overview cards later */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Address</h1>
        <p className="break-all font-mono text-sm text-muted">{address}</p>
      </div>

      <div className="flex flex-col gap-4">
        <AddressTabs address={address} active={tab} />

        {tab === "transactions" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-sm text-muted">
                <span className="font-mono text-ink">
                  {data.total.toLocaleString("en-US")}
                </span>{" "}
                transaction{data.total === 1 ? "" : "s"} found
              </p>
            </div>
            <AddressTxTable address={address} transactions={data.transactions} />
            {data.total > 0 && (
              <Pagination
                basePath={`/address/${address}`}
                page={page}
                limit={LIMIT}
                total={data.total}
              />
            )}
          </div>
        ) : (
          <AddressTabPlaceholder tab={tab} />
        )}
      </div>
    </div>
  );
}
