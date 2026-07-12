"use client";

import { useApi } from "@/lib/api/useApi";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import type { RevenuePoint } from "@/lib/data/types";

// Client region: fetches the 18-month series from /api/revenue.
export default function RevenueTrendRegion({ className = "" }: { className?: string }) {
  const { data, loading, error, retry } = useApi<RevenuePoint[]>(
    "/api/revenue?months=18"
  );

  return (
    <Card
      title="Monthly recurring revenue"
      className={className}
      action={
        <span className="font-mono text-[11px] text-faint">Last 18 months</span>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={retry} className="h-64 md:h-72" />
      ) : loading || !data ? (
        <Skeleton className="h-64 md:h-72" />
      ) : (
        <RevenueTrendChart data={data} />
      )}
    </Card>
  );
}
