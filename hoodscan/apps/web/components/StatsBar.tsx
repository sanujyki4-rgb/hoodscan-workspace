import Link from "next/link";
import type { BlockSummary } from "@/lib/api";
import { avgBlockTimeMs } from "@/lib/format";
import { StackIcon, ActivityIcon, LinkIcon, GaugeIcon, GridIcon } from "./icons";

/** Network-at-a-glance stats + activity chart (tx per block). */

interface StatsBarProps {
  /**
   * Should be a reasonably large sample (50+ blocks) — block
   * timestamps only have second-level precision, so averaging over
   * too few blocks against a sub-second real block time produces
   * meaninglessly coarse/rounded results.
   */
  blocks: BlockSummary[];
  totalBlocks: number | null;
  totalTransactions: number | null;
}

interface Panel {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}

function PanelCell({ panel }: { panel: Panel }) {
  return (
    <Link
      href={panel.href}
      className="group flex items-start gap-2.5 px-5 py-3.5 transition hover:bg-base"
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
    </Link>
  );
}

/**
 * Full-width activity chart: transactions per block over the sample
 * (oldest → newest left → right). Real data only.
 */
function ActivityChart({
  blocksOldestFirst,
  tps,
}: {
  blocksOldestFirst: BlockSummary[];
  tps: number;
}) {
  if (blocksOldestFirst.length < 2) {
    return (
      <p className="px-5 py-6 text-center text-sm text-muted">Not enough blocks for a chart.</p>
    );
  }

  const values = blocksOldestFirst.map((b) => b.txCount);
  const max = Math.max(...values, 1);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const peak = Math.max(...values);
  const n = values.length;

  const w = 100;
  const h = 56;
  const padY = 4;
  const usableH = h - padY * 2;

  const points = values
    .map((v, i) => {
      const x = n === 1 ? w / 2 : (i / (n - 1)) * w;
      const y = padY + usableH - (v / max) * usableH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  const first = blocksOldestFirst[0];
  const last = blocksOldestFirst[n - 1];

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Network activity
          </p>
          <p className="mt-0.5 text-sm text-ink">
            Transactions per block
            <span className="text-muted"> · last {n} blocks</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-xs tabular-nums text-muted">
          <span>
            <span className="text-ink font-semibold">{tps > 0 ? tps.toFixed(1) : "—"}</span> TPS
          </span>
          <span>
            avg <span className="text-ink font-semibold">{avg.toFixed(1)}</span> tx/blk
          </span>
          <span>
            peak <span className="text-ink font-semibold">{peak}</span>
          </span>
        </div>
      </div>

      <div className="relative h-28 w-full text-lime sm:h-32">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={`Transactions per block over the last ${n} blocks`}
        >
          {/* subtle grid lines */}
          {[0.25, 0.5, 0.75].map((t) => {
            const y = padY + usableH * (1 - t);
            return (
              <line
                key={t}
                x1={0}
                y1={y}
                x2={w}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeWidth={0.3}
              />
            );
          })}
          <polyline points={areaPoints} fill="currentColor" opacity={0.1} stroke="none" />
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="flex justify-between font-mono text-[10px] tabular-nums text-muted">
        <span title={first?.timestamp}>#{first.number}</span>
        <span className="text-muted/80">older → newer</span>
        <span title={last?.timestamp}>#{last.number}</span>
      </div>
    </div>
  );
}

export function StatsBar({ blocks, totalBlocks, totalTransactions }: StatsBarProps) {
  const latest = blocks[0];
  const oldest = blocks[blocks.length - 1];
  const avgMs = avgBlockTimeMs(blocks);
  const sampleN = blocks.length;

  const spanSec =
    blocks.length >= 2
      ? (new Date(latest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 1000
      : 0;
  const txInWindow = blocks.reduce((sum, b) => sum + b.txCount, 0);
  const tps = spanSec > 0 ? txInWindow / spanSec : 0;

  const avgGasUsed =
    blocks.length > 0
      ? blocks.reduce((sum, b) => sum + BigInt(b.gasUsed), BigInt(0)) / BigInt(blocks.length)
      : null;
  const avgGasLimit =
    blocks.length > 0
      ? blocks.reduce((sum, b) => sum + BigInt(b.gasLimit), BigInt(0)) / BigInt(blocks.length)
      : null;
  const gasUtilPct =
    avgGasUsed !== null && avgGasLimit !== null && avgGasLimit > BigInt(0)
      ? Number((avgGasUsed * BigInt(10_000)) / avgGasLimit) / 100
      : null;

  const avgTxPerBlockSample = sampleN > 0 ? txInWindow / sampleN : null;

  const fmt = (n: number) => n.toLocaleString("en-US");
  const blocksOldestFirst = [...blocks].reverse();

  const topRow: Panel[] = [
    {
      href: "/blocks",
      icon: <StackIcon size={16} className="text-lime" />,
      label: "Latest block",
      value: latest ? `#${latest.number}` : "—",
      hint:
        (avgMs ? `~${avgMs.toFixed(0)}ms avg` : "—") +
        (totalBlocks !== null ? ` · ${fmt(totalBlocks)} indexed` : ""),
      accent: true,
    },
    {
      href: "/transactions",
      icon: <ActivityIcon size={16} className="text-lime" />,
      label: "Transactions indexed",
      value: totalTransactions !== null ? fmt(totalTransactions) : "—",
      hint: (tps ? `${tps.toFixed(1)} TPS` : "—") + ` · last ${sampleN} blocks`,
    },
    {
      href: latest ? `/block/${latest.number}` : "/blocks",
      icon: <LinkIcon size={16} className="text-lime" />,
      label: "L1 block (via tip)",
      value: latest ? `#${latest.l1BlockNumber}` : "—",
      hint: "from latest L2 block · Ethereum",
    },
  ];

  const bottomRow: Panel[] = [
    {
      href: "/blocks",
      icon: <GaugeIcon size={16} className="text-lime" />,
      label: "Gas utilization",
      value:
        gasUtilPct !== null
          ? gasUtilPct < 0.01
            ? "<0.01%"
            : `${gasUtilPct.toFixed(gasUtilPct < 1 ? 2 : 1)}%`
          : "—",
      hint:
        avgGasUsed !== null
          ? `avg ${fmt(Number(avgGasUsed))} gas · last ${sampleN}`
          : `last ${sampleN} blocks`,
    },
    {
      href: "/stats",
      icon: <GridIcon size={16} className="text-lime" />,
      label: "Avg transactions / block",
      value: avgTxPerBlockSample !== null ? avgTxPerBlockSample.toFixed(2) : "—",
      hint: `last ${sampleN} blocks`,
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
          <ActivityChart blocksOldestFirst={blocksOldestFirst} tps={tps} />
        </div>
      </div>
    </div>
  );
}
