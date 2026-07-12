"use client";

import { useApi } from "@/lib/api/useApi";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/format";
import type { MonthlyReport } from "@/lib/data/types";

// Client region: fetches /api/reports; CSV export is generated client-side
// from the same payload the table renders, so the file always matches the screen.

function formatSignedCurrency(value: number): string {
  if (value === 0) return "—";
  const sign = value > 0 ? "+" : "−";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

function downloadCsv(reports: MonthlyReport[]) {
  const header =
    "Month,Revenue,Net MRR change,New customers,Churned customers,Active customers";
  const rows = reports.map((r) =>
    [
      r.label,
      r.revenue,
      r.netMrrChange,
      r.newCustomers,
      r.churnedCustomers,
      r.activeCustomers,
    ].join(",")
  );
  const blob = new Blob([[header, ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pulse-monthly-reports.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsRegion() {
  const { data, loading, error, retry } = useApi<MonthlyReport[]>("/api/reports");

  return (
    <Card
      title="Monthly reports"
      action={
        <button
          type="button"
          onClick={() => data && downloadCsv(data)}
          disabled={!data}
          className="rounded-md border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Download CSV
        </button>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={retry} className="min-h-[320px]" />
      ) : loading || !data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <div className="-m-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                <th scope="col" className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wider text-muted">
                  Month
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-wider text-muted">
                  Revenue
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-wider text-muted">
                  Net MRR change
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-wider text-muted">
                  New
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-wider text-muted">
                  Churned
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-wider text-muted">
                  Active customers
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((report) => (
                <tr key={report.month} className="transition-colors hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-medium">{report.label}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                    {formatCurrency(report.revenue)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-xs tabular-nums ${
                      report.netMrrChange > 0
                        ? "text-pos"
                        : report.netMrrChange < 0
                          ? "text-neg"
                          : "text-faint"
                    }`}
                  >
                    {formatSignedCurrency(report.netMrrChange)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted">
                    {report.newCustomers}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted">
                    {report.churnedCustomers}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted">
                    {report.activeCustomers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
