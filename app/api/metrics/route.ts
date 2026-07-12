import { withSimulation } from "@/lib/api/simulate";
import { getMetrics } from "@/lib/data/dataset";

// Must never be prerendered: the latency/failure simulation has to run per request.
export const dynamic = "force-dynamic";

export async function GET() {
  return withSimulation(() => getMetrics());
}
