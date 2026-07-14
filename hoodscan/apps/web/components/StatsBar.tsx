import Link from "next/link";
import type { BlockSummary } from "@/lib/api";
import { avgBlockTimeMs } from "@/lib/format";

interface StatsBarProps {
  /**
   * Should be a reasonably large sample (50+ blocks) — block
   * timestamps only have second-level precision, so averaging over
   * too few blocks against a sub-second real block time produces
   * meaninglessly coarse/rounded results. Also used to look up the
   * most recent finalized block, average gas usage, and the tx-count
   * sparkline, all within the sample.
   */
  blocks: BlockSummary[];
  totalBlocks: number | null;
  totalTransactions: number | null;
}

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-lime">
      <rect x="4" y="4" width="16" height="3.5" rx="1" fill="currentColor" opacity="0.95" />
      <rect x="4" y="10.25" width="16" height="3.5" rx="1" fill="currentColor" opacity="0.65" />
      <rect x="4" y="16.5" width="16" height="3.5" rx="1" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-lime">
      <path
        d="M3 12h4l2-7 4 14 2-7h6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FinalityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-lime">
      <path
        d="M12 3l7 3v5.5c0 4.5-3 7.9-7 9.5-4-1.6-7-5-7-9.5V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.2l2.1 2.1L15.5 10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-lime">
      <path d="M4 16a8 8 0 1 1 16 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 16l4-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-lime">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.9" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.9" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.9" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

/** Small inline trend line — real data (tx count per block across the
 * fetched sample), not decoration. Etherscan-style chart, honestly
 * scoped to what we can actually measure client-side. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 26 - (v / max) * 22;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `0,26 ${points} 100,26`;

  return (
    <svg viewBox="0 0 100 26" preserveAspectRatio="none" className="h-full w-full text-lime">
      <polyline points={areaPoints} fill="currentColor" opacity="0.08" stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Panel {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
  chart?: React.ReactNode;
}

function PanelCell({ panel }: { panel: Panel }) {
  return (
    <Link
      href={panel.href}
      className="group relative flex items-start gap-2.5 overflow-hidden px-5 py-3.5 transition hover:bg-base"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-bright/10 transition group-hover:bg-lime-bright/20">
        {panel.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {panel.label}
        </p>
        <p
          className={`truncate font-mono text-lg font-bold tabular-nums ${
            panel.accent ? "text-lime" : "text-ink"
          }`}
        >
          {panel.value}
        </p>
        <p className="truncate text-xs text-muted">{panel.hint}</p>
      </div>
      {panel.chart && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 opacity-60">
          {panel.chart}
        </div>
      )}
    </Link>
  );
}

export function StatsBar({ blocks, totalBlocks, totalTransactions }: StatsBarProps) {
  const latest = blocks[0];
  const oldest = blocks[blocks.length - 1];
  const avgMs = avgBlockTimeMs(blocks);

  const spanSec =
    blocks.length >= 2
      ? (new Date(latest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 1000
      : 0;
  const txInWindow = blocks.reduce((sum, b) => sum + b.txCount, 0);
  const tps = spanSec > 0 ? txInWindow / spanSec : 0;

  const lastFinalized = blocks.find((b) => b.isFinalized) ?? null;
  const finalityLag =
    lastFinalized && latest ? Number(latest.number) - Number(lastFinalized.number) : null;

  const avgGasUsed =
    blocks.length > 0
      ? blocks.reduce((sum, b) => sum + BigInt(b.gasUsed), BigInt(0)) / BigInt(blocks.length)
      : null;

  const avgTxPerBlock =
    totalTransactions !== null && totalBlocks !== null && totalBlocks > 0
      ? totalTransactions / totalBlocks
      : null;

  const fmt = (n: number) => n.toLocaleString("en-US");
  const txSeries = [...blocks].reverse().map((b) => b.txCount);

  const topRow: Panel[] = [
    {
      href: "/blocks",
      icon: <LayersIcon />,
      label: "Latest block",
      value: latest ? `#${fmt(Number(latest.number))}` : "—",
      hint:
        (avgMs ? `${avgMs.toFixed(0)}ms avg` : "—") +
        (totalBlocks !== null ? ` · ${fmt(totalBlocks)} indexed` : ""),
      accent: true,
    },
    {
      href: "/transactions",
      icon: <ActivityIcon />,
      label: "Transactions indexed",
      value: totalTransactions !== null ? fmt(totalTransactions) : "—",
      hint: (tps ? `${tps.toFixed(1)} TPS` : "—") + ` · last ${blocks.length} blocks`,
      chart: <Sparkline values={txSeries} />,
    },
    {
      href: lastFinalized ? `/block/${lastFinalized.number}` : "/blocks",
      icon: <FinalityIcon />,
      label: "Last finalized block",
      value: lastFinalized ? `#${fmt(Number(lastFinalized.number))}` : "—",
      hint:
        finalityLag !== null
          ? `${fmt(finalityLag)} block${finalityLag === 1 ? "" : "s"} behind tip`
          : `none finalized in last ${blocks.length} blocks`,
    },
  ];

  const bottomRow: Panel[] = [
    {
      href: "/blocks",
      icon: <GaugeIcon />,
      label: "Avg gas used",
      value: avgGasUsed !== null ? fmt(Number(avgGasUsed)) : "—",
      hint: `per block · last ${blocks.length} blocks`,
    },
    {
      href: "/stats",
      icon: <GridIcon />,
      label: "Avg transactions / block",
      value: avgTxPerBlock !== null ? avgTxPerBlock.toFixed(2) : "—",
      hint: "all-time average",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">
        Network at a glance
      </p>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-black/[0.03] ring-1 ring-black/[0.02]">
        <div className="h-1 w-full bg-gradient-to-r from-lime-bright via-lime-bright-dark to-lime-bright opacity-80" />
        <div className="divide-y divide-border">
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {topRow.map((panel) => (
              <PanelCell key={panel.label} panel={panel} />
            ))}
          </div>
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {bottomRow.map((panel) => (
              <PanelCell key={panel.label} panel={panel} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
