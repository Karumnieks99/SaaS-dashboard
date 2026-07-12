"use client";

import RouteError from "@/components/ui/RouteError";

export default function CustomersError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError routeName="Customers" reset={reset} />;
}
