"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/api/useApi";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { PlanBadge, StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CustomerPage, CustomerSortField } from "@/lib/data/types";

// Client region: the entire table is driven by /api/customers query params.
// Filtering, sorting, and pagination all happen server-side in the route
// handler — every interaction here is a real HTTP round trip. Filter/sort/
// page state lives in the URL (not local state) so it survives reload,
// back/forward, and shared links.

const SORTABLE: Array<{ field: CustomerSortField; label: string; align?: "right" }> = [
  { field: "company", label: "Company" },
  { field: "status", label: "Status" },
  { field: "mrr", label: "MRR", align: "right" },
  { field: "signupDate", label: "Signed up", align: "right" },
];

const selectClass =
  "h-9 rounded-md border border-line bg-surface px-2.5 text-sm text-ink transition-colors hover:border-line-strong";

export default function CustomerTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get("query") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const status = searchParams.get("status") ?? "";
  const sort = (searchParams.get("sort") as CustomerSortField) ?? "signupDate";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // The textbox shows the in-progress draft while the user types; once the
  // draft lands in the URL (or there is none), it shows the URL's query.
  const [draft, setDraft] = useState<string | null>(null);
  const input = draft ?? query;
  if (draft !== null && draft === query) {
    // URL caught up with the draft — release it so back/forward and
    // "Clear filters" drive the textbox again. (Render-adjust, not an effect.)
    setDraft(null);
  }

  const applyParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const updateFilters = useCallback(
    (patch: Record<string, string | null>) => {
      applyParams((params) => {
        for (const [key, value] of Object.entries(patch)) {
          if (!value) params.delete(key);
          else params.set(key, value);
        }
        params.delete("page");
      });
    },
    [applyParams]
  );

  function goToPage(nextPage: number) {
    applyParams((params) => {
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));
    });
  }

  // Debounce typing so each keystroke doesn't become its own request.
  useEffect(() => {
    if (draft === null || draft === query) return;
    const t = setTimeout(() => updateFilters({ query: draft || null }), 300);
    return () => clearTimeout(t);
  }, [draft, query, updateFilters]);

  const url = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), sort, dir });
    if (query) params.set("query", query);
    if (plan) params.set("plan", plan);
    if (status) params.set("status", status);
    return `/api/customers?${params.toString()}`;
  }, [page, query, plan, status, sort, dir]);

  const { data, loading, error, retry } = useApi<CustomerPage>(url);
  const refreshing = loading && data !== null;

  function toggleSort(field: CustomerSortField) {
    if (sort === field) {
      updateFilters({ sort: field, dir: dir === "asc" ? "desc" : "asc" });
    } else {
      updateFilters({ sort: field, dir: field === "company" ? "asc" : "desc" });
    }
  }

  const hasFilters = query !== "" || plan !== "" || status !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={input}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search company, name, or email"
          aria-label="Search customers"
          className="h-9 w-full max-w-xs rounded-md border border-line bg-surface px-3 text-sm placeholder:text-faint transition-colors hover:border-line-strong sm:w-64"
        />
        <select
          value={plan}
          onChange={(e) => updateFilters({ plan: e.target.value })}
          aria-label="Filter by plan"
          className={selectClass}
        >
          <option value="">All plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          aria-label="Filter by status"
          className={selectClass}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="churned">Churned</option>
        </select>
        {refreshing && (
          <span className="font-mono text-[11px] text-faint" role="status">
            Updating…
          </span>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={retry} className="min-h-[320px]" />
      ) : !data ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10" />
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="-m-5 overflow-x-auto">
            <table
              className={`w-full min-w-[640px] text-sm transition-opacity ${
                refreshing ? "opacity-50" : ""
              }`}
            >
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-left">
                  <SortableHeader
                    {...SORTABLE[0]}
                    sort={sort}
                    dir={dir}
                    onSort={toggleSort}
                  />
                  <th scope="col" className="px-4 py-2.5 font-mono text-[11px] font-normal uppercase tracking-wider text-muted">
                    Plan
                  </th>
                  <SortableHeader
                    {...SORTABLE[1]}
                    sort={sort}
                    dir={dir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    {...SORTABLE[2]}
                    sort={sort}
                    dir={dir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    {...SORTABLE[3]}
                    sort={sort}
                    dir={dir}
                    onSort={toggleSort}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <p className="text-sm font-medium">No customers found</p>
                      <p className="mt-1 text-xs text-muted">
                        Nothing matches these filters.
                      </p>
                      {hasFilters && (
                        <button
                          type="button"
                          onClick={() => {
                            setDraft("");
                            updateFilters({ query: null, plan: null, status: null });
                          }}
                          className="mt-3 rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  data.customers.map((customer) => (
                    <tr key={customer.id} className="transition-colors hover:bg-surface-2/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{customer.company}</p>
                        <p className="text-xs text-muted">{customer.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <PlanBadge plan={customer.plan} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {customer.status === "active" ? (
                          formatCurrency(customer.mrr)
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted">
                        {formatDate(customer.signupDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="-mx-5 -mb-5 mt-5 flex items-center justify-between border-t border-line px-4 py-3">
            <p className="font-mono text-[11px] tabular-nums text-muted">
              {data.total === 0
                ? "0 customers"
                : `${(data.page - 1) * data.pageSize + 1}–${Math.min(
                    data.page * data.pageSize,
                    data.total
                  )} of ${data.total}`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={data.page <= 1 || loading}
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={data.page >= data.totalPages || loading}
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function SortableHeader({
  field,
  label,
  align,
  sort,
  dir,
  onSort,
}: {
  field: CustomerSortField;
  label: string;
  align?: "right";
  sort: CustomerSortField;
  dir: "asc" | "desc";
  onSort: (field: CustomerSortField) => void;
}) {
  const active = sort === field;
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
      className={`px-4 py-2.5 font-mono text-[11px] font-normal uppercase tracking-wider text-muted ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-ink ${
          active ? "text-ink" : ""
        }`}
      >
        {label}
        <span aria-hidden="true" className="text-[9px]">
          {active ? (dir === "asc" ? "▲" : "▼") : "△"}
        </span>
      </button>
    </th>
  );
}
