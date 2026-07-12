"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { formatCompactCurrency } from "@/lib/format";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { RevenuePoint } from "@/lib/data/types";

// Client component: Recharts renders to the DOM. Single series — the card
// title names it, so no legend (identity is not color-alone). Stroke-only
// trace on a dotted graticule: the monitor look, no area fill.
export default function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="h-64 w-full md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray="2 6"
          />
          <XAxis
            dataKey="label"
            tickFormatter={(label: string) => label.split(" ")[0]}
            tick={{ fontSize: 11, fill: "var(--faint)", fontFamily: "var(--font-data)" }}
            axisLine={{ stroke: "var(--line-strong)" }}
            tickLine={false}
            minTickGap={24}
            dy={6}
          />
          <YAxis
            tickFormatter={(v: number) => formatCompactCurrency(v)}
            tick={{ fontSize: 11, fill: "var(--faint)", fontFamily: "var(--font-data)" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--line-strong)", strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--accent)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{
              r: 3.5,
              fill: "var(--accent)",
              strokeWidth: 2,
              stroke: "var(--canvas)",
            }}
            isAnimationActive={!reduceMotion}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
