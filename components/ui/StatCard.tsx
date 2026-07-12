import { formatDelta } from "@/lib/format";

// Shared by the compact cards and the hero metric in KpiRow.
export function DeltaText({
  delta,
  deltaSuffix = "%",
  goodWhenDown = false,
}: {
  delta: number;
  /** "%" for relative deltas, " pts" for churn's percentage-point delta. */
  deltaSuffix?: string;
  /** Churn: a falling number is the good direction. */
  goodWhenDown?: boolean;
}) {
  const improving = goodWhenDown ? delta < 0 : delta > 0;
  const deltaColor =
    delta === 0 ? "text-muted" : improving ? "text-pos" : "text-neg";

  return (
    <p className={`font-mono text-xs tabular-nums ${deltaColor}`}>
      {formatDelta(delta, deltaSuffix)}
      <span className="text-faint"> vs last month</span>
    </p>
  );
}

// Compact secondary stat: deliberately quieter and smaller than the MRR hero
// card it sits beside. Value bottom-anchored so the row reads as one baseline.
export default function StatCard({
  label,
  value,
  delta,
  deltaSuffix,
  goodWhenDown,
}: {
  label: string;
  value: string;
  delta: number;
  deltaSuffix?: string;
  goodWhenDown?: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface px-5 py-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-auto pt-3 font-mono text-xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      <div className="mt-1">
        <DeltaText delta={delta} deltaSuffix={deltaSuffix} goodWhenDown={goodWhenDown} />
      </div>
    </div>
  );
}
