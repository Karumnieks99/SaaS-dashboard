# Pulse — SaaS Analytics Dashboard (Spec)

> Reconstructed spec. The **STACK** and **ARCHITECTURE** sections are the user's text,
> verbatim. Sections marked *(drafted)* were filled in by Claude with user-approved
> SaaS-analytics defaults — correct anything that doesn't match the original intent.

## STACK

Next.js 14+ (App Router) + TypeScript + Tailwind. Recharts for charts.
Deployable to Vercel. No database — the mock API lives in Next.js route
handlers (app/api/...) returning JSON from the source-of-truth dataset
module, with 300–700ms simulated latency and a 5% simulated failure rate,
so all fetches are real HTTP requests with real loading/error/retry states.

## PRODUCT *(drafted)*

"Pulse" — an analytics dashboard for a fictional B2B SaaS. Three views: business
overview, customer directory, monthly reports. The goal is portfolio-grade realism:
every number on screen traces back to one dataset, and every fetch behaves like a
real network call.

## DATA LAYER *(drafted)*

- `lib/data/dataset.ts` is the single source of truth, generated with a **seeded**
  PRNG (mulberry32, fixed seed) — identical data on every request, reload, and deploy.
- ~80 customers: id, name, company, email, plan (Starter / Pro / Enterprise), status
  (active / trialing / churned), MRR, signup date, last-active date.
- 18 months of monthly revenue/MRR series **derived from the customers** (sum of MRR
  of customers active in that month, given signup/churn dates) — KPI cards, charts,
  the customer table, and reports are all internally consistent.
- Derived KPIs: current MRR, ARR, active customers, churn rate, each with delta vs
  previous month.
- Reports: one summary per month — revenue, new customers, churned customers, net
  MRR movement.
- API endpoints (all GET):
  - `/api/metrics` → KPI summary
  - `/api/revenue?months=N` → time series
  - `/api/customers?page&query&plan&status&sort&dir` → filtered/sorted/paginated list
    (filtering happens **server-side in the handler**, so table interactions are real
    HTTP round trips)
  - `/api/reports` → monthly summaries
- `lib/api/simulate.ts` is shared by every handler: random 300–700 ms delay, then a
  5% chance of returning `{ error }` with HTTP 500.

## ARCHITECTURE

- File-based routing: /overview, /customers, /reports as App Router routes
  with a shared layout (sidebar + top bar) that does not re-render on
  navigation
- Use server components for the static shell; data regions are client
  components fetching from the route handlers — keep the boundary
  deliberate and commented, not accidental
- Loading states via loading.tsx per route in addition to per-region
  skeletons; error.tsx boundaries with retry
- Proper metadata API usage (page titles per route) — small, but real
  products have it

## PAGES *(drafted)*

- **/overview** — KPI stat row (MRR, ARR, active customers, churn rate, with deltas);
  revenue-over-time area chart (18 mo); MRR-by-plan breakdown; recent signups.
- **/customers** — search + plan/status filters + sortable columns + pagination, all
  driven by query params to `/api/customers`; rows: company, plan badge, status, MRR,
  signup date.
- **/reports** — monthly summary table from `/api/reports` with client-side
  "Download CSV".

## UX STATES *(drafted)*

- Per-region skeletons while a region's fetch is in flight.
- Per-route `loading.tsx` page-shaped skeletons; per-route `error.tsx` with retry.
- The simulated 5% failures render an inline error card with a Retry button scoped to
  that region — one failed region never blanks the page.

## DESIGN *(drafted; amended 2026-07-12 per user direction)*

Committed dark "monitor" UI: Pulse is a vitals display for revenue. Deep
green-cast ink surfaces (`color-scheme` pinned to dark — the app does not
follow the OS light preference), warm paper-white text, phosphor-teal accent
reserved for data and live state. Two disjoint badge scales: customer status
on green/amber/gray, plan tier on a steel-blue ordinal ramp. Three type roles:
Geist Sans for UI chrome, Spline Sans Mono for every numeral (the data voice),
Bricolage Grotesque for identity (wordmark, page titles). MRR is the overview
hero — one large card with a 12-month EKG sparkline ending in a live blip (the
app's one flourish; suppressed under reduced motion). Charts are stroke-only
lines on a dotted graticule, custom tooltips, no gradient fills. Responsive
down to tablet; sidebar collapses to top nav on small screens.
