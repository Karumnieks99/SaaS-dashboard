"use client";

import RouteError from "@/components/ui/RouteError";

export default function OverviewError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError routeName="Overview" reset={reset} />;
}
