import type { Metadata } from "next";
import ReportsRegion from "@/components/regions/ReportsRegion";

export const metadata: Metadata = {
  title: "Reports",
};

// Server component: static structure; the report table is the client boundary.
export default function ReportsPage() {
  return <ReportsRegion />;
}
