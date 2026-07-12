import type { NextRequest } from "next/server";
import { withSimulation } from "@/lib/api/simulate";
import { queryCustomers } from "@/lib/data/dataset";
import type { CustomerSortField, CustomerStatus, Plan } from "@/lib/data/types";

export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

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
  );
}
