export function GasBar({ used, limit }: { used: string; limit: string }) {
  const usedNum = Number(used);
  const limitNum = Number(limit);
  const pct = limitNum > 0 ? Math.min((usedNum / limitNum) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-14 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-lime-bright"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="tabular-nums">{pct.toFixed(1)}%</span>
    </div>
  );
}
