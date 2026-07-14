import { StatCard } from "@/components/StatCard";
import { getLatestBlocks, getPaginatedBlocks, getPaginatedTransactions } from "@/lib/api";
import { avgBlockTimeMs } from "@/lib/format";

export const revalidate = 10;

export default async function StatsPage() {
  const [recentBlocks, blockTotals, txTotals] = await Promise.all([
    getLatestBlocks(50),
    getPaginatedBlocks(1, 0),
    getPaginatedTransactions(1, 0),
  ]);

  const avgBlockTimeMsValue = recentBlocks ? avgBlockTimeMs(recentBlocks) : 0;
  const latestBlock = recentBlocks?.[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Chain stats
        </h1>
        <p className="mt-1 text-sm text-muted">
          Live figures for Robinhood Chain, derived from data hoodscan
          has indexed so far.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Latest block"
          value={latestBlock ? `#${Number(latestBlock.number).toLocaleString()}` : "—"}
          accent
        />
        <StatCard
          label="Avg block time"
          value={avgBlockTimeMsValue ? `${avgBlockTimeMsValue.toFixed(0)}ms` : "—"}
          hint="Measured over the last 50 blocks"
        />
        <StatCard
          label="Chain ID"
          value="4663"
          hint="Robinhood Chain Mainnet"
        />
        <StatCard
          label="Blocks indexed"
          value={blockTotals ? blockTotals.total.toLocaleString() : "—"}
          hint="By this hoodscan instance"
        />
        <StatCard
          label="Transactions indexed"
          value={txTotals ? txTotals.total.toLocaleString() : "—"}
          hint="By this hoodscan instance"
        />
        <StatCard
          label="Mainnet launch"
          value="Jul 1, 2026"
          hint="Built on Arbitrum"
        />
      </div>
    </div>
  );
}
