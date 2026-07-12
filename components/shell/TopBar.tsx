import NavLink from "./NavLink";
import PageTitle from "./PageTitle";
import { NAV_ITEMS } from "./nav-items";

// Server component except for two deliberate client leaves: PageTitle and the
// NavLinks (both need the current pathname). Everything else renders on the
// server and never re-renders on navigation.
export default function TopBar() {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-8">
        <PageTitle />
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-xs text-muted sm:inline">
            {today}
          </span>
          <div
            className="flex size-8 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-medium text-accent-ink"
            aria-label="Signed in as Demo User"
          >
            DU
          </div>
        </div>
      </div>

      {/* Mobile: the sidebar is hidden below md, so navigation moves up here. */}
      <nav
        className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden"
        aria-label="Main"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
