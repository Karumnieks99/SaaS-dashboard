"use client";

import {
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { RevenuePoint } from "@/lib/data/types";

// The blip at the trace's end: a static dot plus an expanding ring
// (.live-ping — suppressed under prefers-reduced-motion, the dot remains).
function LiveBlip({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx == null || cy == null) return <g />;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--accent)"
        opacity={0.35}
        className="live-ping"
      />
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="var(--accent)"
        stroke="var(--canvas)"
        strokeWidth={1.5}
      />
    </g>
  );
}

// Client component (Recharts). The hero card's 12-month EKG trace — the app's
// one flourish. It duplicates the main chart's data at a glance, so it stays
// decorative: no axes, grid, or tooltip, and hidden from assistive tech (the
// hero's value + delta text carry the information).
export default function MrrSparkline({ data }: { data: RevenuePoint[] }) {
  const reduceMotion = useReducedMotion();
  const last = data[data.length - 1];

  return (
    <div className="h-12 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 2, left: 2 }}>
          <XAxis dataKey="label" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--accent)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={!reduceMotion}
          />
          {last && (
            <ReferenceDot x={last.label} y={last.revenue} shape={<LiveBlip />} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
