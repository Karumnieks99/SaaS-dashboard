"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { formatCompactCurrency } from "@/lib/format";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { RevenuePoint } from "@/lib/data/types";

// Client component (Recharts). Plans are ordered tiers, so this is an ordinal
// one-hue steel-blue ramp (dim→bright = starter→enterprise), not a categorical
// palette — deliberately distinct from both the status greens and the accent.
// Values are direct-labeled, so identity is never color-alone.
const TIERS = [
  { key: "starter", name: "Starter", fill: "var(--tier-starter)" },
  { key: "pro", name: "Pro", fill: "var(--tier-pro)" },
  { key: "enterprise", name: "Enterprise", fill: "var(--tier-enterprise)" },
] as const;

export default function PlanMixBars({ point }: { point: RevenuePoint }) {
  const reduceMotion = useReducedMotion();
  const data = TIERS.map((tier) => ({
    name: tier.name,
    value: point[tier.key],
    fill: tier.fill,
  }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 56, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
            width={78}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar
            dataKey="value"
            barSize={20}
            radius={[0, 4, 4, 0]}
            isAnimationActive={!reduceMotion}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => formatCompactCurrency(Number(v))}
              style={{
                fontSize: 11,
                fill: "var(--ink)",
                fontFamily: "var(--font-data)",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
