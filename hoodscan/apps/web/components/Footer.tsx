import Link from "next/link";

/**
 * Site footer. Pure static content — no data fetching, no
 * interactivity — so this stays a plain server component.
 */
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-8 px-8 py-10 sm:grid-cols-4 sm:px-12 lg:px-20">
        <div className="col-span-2 flex flex-col gap-2 sm:col-span-1">
          <span className="text-sm font-bold tracking-tight">
            hood<span className="text-lime">scan</span>
          </span>
          <p className="text-xs text-muted">
            A block explorer for Robinhood Chain.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Explore
          </p>
          <Link href="/blocks" className="text-xs text-muted hover:text-lime">
            Latest blocks
          </Link>
          <Link href="/transactions" className="text-xs text-muted hover:text-lime">
            Latest transactions
          </Link>
          <Link href="/transactions/l1-to-l2" className="text-xs text-muted hover:text-lime">
            L1↔L2 messages
          </Link>
          <Link href="/stats" className="text-xs text-muted hover:text-lime">
            Chain stats
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Network
          </p>
          <span className="text-xs text-muted">Robinhood Chain Mainnet</span>
          <span className="text-xs text-muted">Chain ID 4663</span>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            About
          </p>
          <p className="text-xs text-muted">
            Independent, community-built. Not affiliated with Robinhood
            Markets, Inc.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] border-t border-border px-8 py-4 sm:px-12 lg:px-20">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} hoodscan
        </p>
      </div>
    </footer>
  );
}
