import { withSimulation } from "@/lib/api/simulate";
import { getReports } from "@/lib/data/dataset";

export const dynamic = "force-dynamic";

export async function GET() {
  return withSimulation(() => getReports());
}
