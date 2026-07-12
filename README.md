# Pulse

A portfolio-grade SaaS analytics dashboard for a fictional B2B product.
Three views — business overview, customer directory, monthly reports — where
every number on screen traces back to a single seeded dataset, and every
fetch behaves like a real network call (real HTTP requests, simulated
latency, simulated failures, retry).

See [`SPEC.md`](./SPEC.md) and [`PRODUCT.md`](./PRODUCT.md) for the full spec
and product framing.

## Stack

Next.js (App Router) + TypeScript + Tailwind, charts via Recharts. No
database — `app/api/*` route handlers read from `lib/data/dataset.ts`, the
single source of truth, with 300–700ms simulated latency and a 5% simulated
failure rate baked into every response.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects into
`/overview`.

```bash
npm run build   # production build
npm run start   # serve the production build
```

## Project structure

- `app/(dashboard)/{overview,customers,reports}` — the three routes, each
  with its own `loading.tsx` skeleton and `error.tsx` retry boundary.
- `app/api/{metrics,revenue,customers,reports}` — mock API route handlers.
  `/api/customers` supports `page`, `query`, `plan`, `status`, `sort`, `dir`
  and does real server-side filtering/sorting/pagination.
- `lib/data/dataset.ts` — seeded (mulberry32) dataset generation: ~80
  customers plus an 18-month revenue/MRR series derived from their
  signup/churn dates. Anchored to the current month at runtime, so figures
  shift naturally at month boundaries.
- `lib/api/simulate.ts` — shared latency/failure simulation used by every
  route handler.
- `components/regions/*` — client components that own a fetch (via
  `lib/api/useApi.ts`) plus its loading/error/empty states.
- `components/charts/*` and `components/ui/*` — presentational chart and UI
  primitives with no data-fetching of their own.

## Design

Dark "monitor" theme: deep green-cast ink surfaces, phosphor-teal accent
reserved for data/live state, disjoint badge scales for customer status
(green/amber/gray) vs. plan tier (steel-blue ramp). Geist Sans for UI chrome,
Spline Sans Mono for every numeral, Bricolage Grotesque for identity. Charts
are stroke-only on a dotted graticule; the MRR hero card's EKG sparkline and
live blip are the one animated flourish, suppressed under
`prefers-reduced-motion`.
