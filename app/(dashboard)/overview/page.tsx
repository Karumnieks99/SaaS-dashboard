import type { Metadata } from "next";
import KpiRow from "@/components/regions/KpiRow";
import PlanMixRegion from "@/components/regions/PlanMixRegion";
import RecentSignupsRegion from "@/components/regions/RecentSignupsRegion";
import RevenueTrendRegion from "@/components/regions/RevenueTrendRegion";

export const metadata: Metadata = {
  title: "Overview",
};

// Server component: static page structure only. Each region below is a client
// component that fetches its own slice of the API — the deliberate boundary.
export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <KpiRow />
      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <RevenueTrendRegion className="lg:col-span-2" />
        <PlanMixRegion />
      </div>
      <RecentSignupsRegion />
    </div>
  );
}
