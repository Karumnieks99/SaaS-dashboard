"use client";

import { formatCurrency } from "@/lib/format";

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

// Shared Recharts tooltip: surface card, mono figures, series identity carried
// by a colored chip + text (never text in the series color).
export default function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 shadow-xl shadow-black/40">
      <p className="font-mono text-[11px] text-muted">{label}</p>
      {payload.map((entry, i) => (
        <p
          key={i}
          className="mt-1 flex items-center gap-1.5 font-mono text-xs tabular-nums text-ink"
        >
          <span
            aria-hidden="true"
            className="inline-block size-2 rounded-[2px]"
            style={{ background: entry.color }}
          />
          {typeof entry.value === "number" ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}
