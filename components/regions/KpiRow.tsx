"use client";

import { useApi } from "@/lib/api/useApi";
import MrrSparkline from "@/components/charts/MrrSparkline";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import StatCard, { DeltaText } from "@/components/ui/StatCard";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { MetricsSummary, RevenuePoint } from "@/lib/data/types";

// Client region: /api/metrics drives the numbers over real HTTP; a second
// fetch of the 12-month series feeds the hero sparkline. MRR is the hero —
// one large card with the EKG trace — and the other three stats are compact.
// The sparkline is decoration on the hero, so its failure degrades to a quiet
// inline retry instead of taking the region down.
export default function KpiRow() {
  const metrics = useApi<MetricsSummary>("/api/metrics");
  const trend = useApi<RevenuePoint[]>("/api/revenue?months=12");

  if (metrics.error) {
    return (
      <ErrorState
        message={metrics.error}
        onRetry={metrics.retry}
        className="min-h-[176px]"
      />
    );
  }

  if (metrics.loading || !metrics.data) {
    return (
      <div className="grid gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
        <Skeleton className="h-44 rounded-lg md:col-span-3 lg:col-span-2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg lg:h-44" />
        ))}
      </div>
    );
  }

  const data = metrics.data;

  return (
    <div className="grid gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
      <section
        aria-label="Monthly recurring revenue"
        className="rounded-lg border border-line bg-surface px-5 py-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] md:col-span-3 lg:col-span-2"
      >
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
          MRR
        </p>
        <p className="mt-2 font-mono text-4xl font-semibold leading-none tracking-tight tabular-nums md:text-[2.75rem]">
          {formatCurrency(data.mrr.value)}
        </p>
        <div className="mt-2">
          <DeltaText delta={data.mrr.delta} />
        </div>
        <div className="mt-3">
          {trend.error ? (
            <p className="flex h-12 items-center font-mono text-[11px] text-faint">
              Trend unavailable ·
              <button
                type="button"
                onClick={trend.retry}
                className="ml-1 underline transition-colors hover:text-muted"
              >
                retry
              </button>
            </p>
          ) : trend.loading || !trend.data ? (
            <Skeleton className="h-12" />
          ) : (
            <MrrSparkline data={trend.data} />
          )}
        </div>
      </section>

      <StatCard
        label="ARR"
        value={formatCurrency(data.arr.value)}
        delta={data.arr.delta}
      />
      <StatCard
        label="Active customers"
        value={String(data.activeCustomers.value)}
        delta={data.activeCustomers.delta}
      />
      <StatCard
        label="Churn rate"
        value={formatPercent(data.churnRate.value)}
        delta={data.churnRate.delta}
        deltaSuffix=" pts"
        goodWhenDown
      />
    </div>
  );
}
