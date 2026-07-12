"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Client component: needs usePathname for the active state. This is the only
// client piece of the navigation — icons and structure stay server-rendered
// and are passed through as children.
export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-accent-soft font-medium text-accent-ink"
          : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
