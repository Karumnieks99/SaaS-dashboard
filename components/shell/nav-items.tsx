// Server module: nav structure + icons shared by the sidebar and mobile nav.

function IconOverview() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
      <path
        d="M1.5 8.5h3l2-4.5 3 8 2-3.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCustomers() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
      <circle cx="5.5" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M1.5 13.5c0-2.2 1.8-4 4-4s4 1.8 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.5 3.2a2.25 2.25 0 0 1 0 3.6M12 9.9c1.5.6 2.5 2 2.5 3.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconReports() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
      <rect
        x="2.5"
        y="1.5"
        width="11"
        height="13"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 10.5V8.5M8 10.5v-4M10.5 10.5v-2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: <IconOverview /> },
  { href: "/customers", label: "Customers", icon: <IconCustomers /> },
  { href: "/reports", label: "Reports", icon: <IconReports /> },
] as const;
