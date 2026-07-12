import type { NextRequest } from "next/server";
import { withSimulation } from "@/lib/api/simulate";
import { getRevenueSeries } from "@/lib/data/dataset";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const monthsParam = Number(request.nextUrl.searchParams.get("months"));
  const months = Number.isFinite(monthsParam) && monthsParam > 0 ? monthsParam : 18;
  return withSimulation(() => getRevenueSeries(months));
}
