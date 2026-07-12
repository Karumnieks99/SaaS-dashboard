"use client";

import { useApi } from "@/lib/api/useApi";
import PlanMixBars from "@/components/charts/PlanMixBars";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import type { RevenuePoint } from "@/lib/data/types";

// Client region: fetches just the current month from /api/revenue for the
// per-plan MRR split.
export default function PlanMixRegion({ className = "" }: { className?: string }) {
  const { data, loading, error, retry } = useApi<RevenuePoint[]>(
    "/api/revenue?months=1"
  );
  const current = data?.[data.length - 1];

  return (
    <Card
      title="MRR by plan"
      className={className}
      action={<span className="font-mono text-[11px] text-faint">This month</span>}
    >
      {error ? (
        <ErrorState message={error} onRetry={retry} className="h-52" />
      ) : loading || !current ? (
        <Skeleton className="h-52" />
      ) : (
        <PlanMixBars point={current} />
      )}
    </Card>
  );
}
