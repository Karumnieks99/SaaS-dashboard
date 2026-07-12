"use client";

import Link from "next/link";
import { useApi } from "@/lib/api/useApi";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { PlanBadge, StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { CustomerPage } from "@/lib/data/types";

// Client region: newest signups via the same /api/customers endpoint the
// Customers page uses, just sorted by signup date.
export default function RecentSignupsRegion() {
  const { data, loading, error, retry } = useApi<CustomerPage>(
    "/api/customers?sort=signupDate&dir=desc"
  );

  return (
    <Card
      title="Recent signups"
      action={
        <Link
          href="/customers"
          className="text-xs font-medium text-accent-ink hover:underline"
        >
          View all customers →
        </Link>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : loading || !data ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {data.customers.slice(0, 5).map((customer) => (
            <li
              key={customer.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{customer.company}</p>
                <p className="truncate text-xs text-muted">{customer.name}</p>
              </div>
              <PlanBadge plan={customer.plan} />
              <StatusBadge status={customer.status} />
              <span className="w-24 text-right font-mono text-xs tabular-nums text-muted">
                {formatDate(customer.signupDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
