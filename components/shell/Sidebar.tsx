import NavLink from "./NavLink";
import PulseMark from "./PulseMark";
import { NAV_ITEMS } from "./nav-items";

// Server component: static chrome. Rendered once per session — it lives in the
// (dashboard) layout, which persists across client-side navigation.
export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-line bg-canvas md:flex">
      <div className="flex items-center gap-2 px-5 pt-5 pb-6">
        <PulseMark className="w-7 text-accent" />
        <span className="font-display text-lg font-semibold tracking-tight">
          Pulse
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3" aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-5 pb-5">
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
          <span className="inline-flex size-2 rounded-full bg-accent" />
          <span className="font-mono text-[11px] text-muted">
            Mock API · live
          </span>
        </div>
        {/* Simulation details are a dev-only disclosure, collapsed by default —
            production builds render nothing here. */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-2 px-1">
            <summary className="cursor-pointer font-mono text-[10px] text-faint hover:text-muted">
              API simulation
            </summary>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-faint">
              300–700 ms latency, 5% simulated failures
            </p>
          </details>
        )}
      </div>
    </aside>
  );
}
