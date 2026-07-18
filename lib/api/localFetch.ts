import { withSimulation } from "@/lib/api/simulate";
import {
  getMetrics,
  getRevenueSeries,
  getReports,
  queryCustomers,
} from "@/lib/data/dataset";
import type { CustomerSortField, CustomerStatus, Plan } from "@/lib/data/types";

// In-browser stand-in for the old `app/api/*` route handlers. Static export
// (GitHub Pages) can't run server-side route handlers that read query
// params, so the same filtering/sorting/pagination + latency/failure
// simulation now runs here, dispatched by parsing the same URL shape the
// route handlers used to receive (e.g. "/api/customers?page=2&sort=mrr").

const PLANS: readonly Plan[] = ["starter", "pro", "enterprise"];
const STATUSES: readonly CustomerStatus[] = ["active", "trialing", "churned"];
const SORT_FIELDS: readonly CustomerSortField[] = [
  "company",
  "mrr",
  "signupDate",
  "status",
];

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

export function localFetch<T>(url: string): Promise<T> {
  const [pathname, search] = url.split("?");
  const params = new URLSearchParams(search ?? "");

  switch (pathname) {
    case "/api/metrics":
      return withSimulation(() => getMetrics()) as Promise<T>;

    case "/api/revenue": {
      const monthsParam = Number(params.get("months"));
      const months = Number.isFinite(monthsParam) && monthsParam > 0 ? monthsParam : 18;
      return withSimulation(() => getRevenueSeries(months)) as Promise<T>;
    }

    case "/api/reports":
      return withSimulation(() => getReports()) as Promise<T>;

    case "/api/customers": {
      const pageParam = Number(params.get("page"));
      const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
      return withSimulation(() =>
        queryCustomers({
          page,
          pageSize: 10,
          query: params.get("query")?.trim() ?? "",
          plan: oneOf(params.get("plan"), PLANS),
          status: oneOf(params.get("status"), STATUSES),
          sort: oneOf(params.get("sort"), SORT_FIELDS) ?? "signupDate",
          dir: params.get("dir") === "asc" ? "asc" : "desc",
        })
      ) as Promise<T>;
    }

    default:
      return Promise.reject(new Error(`localFetch: unknown endpoint "${pathname}"`));
  }
}
