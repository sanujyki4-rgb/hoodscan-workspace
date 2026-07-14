import { L1L2Table } from "@/components/L1L2Table";
import { Pagination } from "@/components/Pagination";
import { getPaginatedL1ToL2Transactions } from "@/lib/api";

export const revalidate = 2;

const LIMIT = 25;

export default async function AllL1ToL2Page({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(Number(searchParams.page) || 1, 1);
  const offset = (page - 1) * LIMIT;

  const data = await getPaginatedL1ToL2Transactions(LIMIT, offset);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          All L1↔L2 messages
        </h1>
        <p className="mt-1 text-sm text-muted">
          Arbitrum-style system transactions that sync state between
          Ethereum L1 and Robinhood Chain.
        </p>
      </div>

      {data === null ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-muted">
          Couldn&apos;t reach the hoodscan API.
        </p>
      ) : (
        <>
          <L1L2Table transactions={data.transactions} />
          <Pagination
            basePath="/transactions/l1-to-l2"
            page={page}
            limit={data.limit}
            total={data.total}
          />
        </>
      )}
    </div>
  );
}
