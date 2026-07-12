"use client";

import RouteError from "@/components/ui/RouteError";

export default function ReportsError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError routeName="Reports" reset={reset} />;
}
