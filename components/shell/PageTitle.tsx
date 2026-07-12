"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/customers": "Customers",
  "/reports": "Reports",
};

// Client component: the top bar lives in the persistent layout, so the visible
// page title has to track the pathname on the client.
export default function PageTitle() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Pulse";

  return (
    <h1 className="font-display text-base font-semibold tracking-tight">
      {title}
    </h1>
  );
}
