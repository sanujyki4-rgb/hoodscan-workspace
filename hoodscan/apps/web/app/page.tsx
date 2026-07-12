import { SearchBar } from "@/components/SearchBar";
import { BlockCard } from "@/components/BlockCard";
import { getLatestBlocks } from "@/lib/api";

export const revalidate = 2;

export default async function HomePage() {
  const blocks = await getLatestBlocks(15);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Robinhood Chain, block by block
        </h1>
        <p className="text-sm text-muted">
          Search any block, transaction, or address on Robinhood Chain (chain ID 4663).
        </p>
        <SearchBar />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          Latest blocks
        </h2>

        {blocks === null || blocks.length === 0 ? (
          <p className="rounded-lg border border-border bg-panel px-4 py-6 text-center text-sm text-muted">
            Couldn&apos;t reach the hoodscan API. Is the indexer running?
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {blocks.map((block) => (
              <BlockCard key={block.number} block={block} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
