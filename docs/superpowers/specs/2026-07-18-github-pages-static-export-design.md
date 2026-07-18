# GitHub Pages static export + live demo link

## Goal

Add a "live demo" link to the README, pointing at a real deployment. The
chosen host is GitHub Pages (matching the pattern used across the user's
other portfolio repos), which only serves static files — no Node.js server,
no dynamic route handlers.

## Why this isn't a one-line README edit

The app's current architecture depends on `app/api/*` route handlers that
read query params from the request (`/api/customers?page=2&sort=mrr&...`)
to do real server-side filtering/sorting/pagination, wrapped in a shared
300–700ms latency + 5% failure simulation (`lib/api/simulate.ts`). Next's
static export (`output: 'export'`) explicitly does not support route
handlers that rely on `Request` data — confirmed against
`node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (Next
16.2.10, the version pinned in this repo). So the API layer has to move
somewhere that runs in the browser instead of on a server.

## Decisions made (via brainstorming Q&A)

1. **Single code path.** `app/api/*` is deleted outright, not kept alongside
   a separate static-only implementation. Both `npm run dev` and the
   GitHub Pages build use the same in-browser logic. Rationale: two parallel
   implementations of the same filtering/sorting/pagination logic would
   drift; the static export forces this anyway, so there's no real "keep the
   server version too" option without extra maintenance burden for no
   benefit.
2. **Deploy via GitHub Actions**, not a manually-pushed `gh-pages` branch.
   Fully automatic on push to `master`.
3. **`basePath: '/SaaS-dashboard'`** — matches the GitHub Pages project-site
   URL `https://karumnieks99.github.io/SaaS-dashboard/` for origin
   `Karumnieks99/SaaS-dashboard`.
4. **GitHub Pages source setting** (Settings → Pages → Source = "GitHub
   Actions") will be set via `gh api`, run by Claude with the exact command
   shown to the user first.

## Architecture

### Transport shim replaces `fetch`, not the calling components

All 6 client regions (`CustomerTable`, `KpiRow`, `RevenueTrendRegion`,
`PlanMixRegion`, `RecentSignupsRegion`, `ReportsRegion`) call
`useApi<T>(url)` with a URL string they build themselves (e.g.
`/api/customers?${params.toString()}`). `useApi`'s only network-shaped
operation is the `fetch(url, { signal })` call inside its `useEffect`.

Plan: add `lib/api/localFetch.ts`, a function with the shape
`localFetch<T>(url: string): Promise<T>` that:

- Parses `url` into pathname + `URLSearchParams` (same as
  `request.nextUrl.searchParams` did server-side).
- Dispatches on pathname to the matching `lib/data/dataset.ts` function:
  - `/api/metrics` → `getMetrics()`
  - `/api/revenue` → `getRevenueSeries(months)`
  - `/api/customers` → `queryCustomers({ page, pageSize: 10, query, plan,
    status, sort, dir })` (same param parsing/validation currently in
    `app/api/customers/route.ts`)
  - `/api/reports` → `getReports()`
- Applies the same simulation currently in `lib/api/simulate.ts`: a random
  300–700ms delay via `setTimeout`, then a 5% chance of rejecting with an
  `Error("Simulated upstream failure. Retry the request.")` instead of
  resolving.

`useApi.ts` changes to call `localFetch<T>(url)` instead of
`fetch(url, { signal }).then(...)`. The `AbortController`/`signal` becomes
unnecessary (there's no real in-flight network request to cancel); the
existing `cancelled` flag + key-comparison logic already handles ignoring
stale results, so it's kept as-is and the abort machinery is dropped.

`lib/api/simulate.ts` is rewritten to export a `withSimulation<T>(data: () =>
T): Promise<T>` that throws on simulated failure instead of returning a
`NextResponse`, and `app/api/*` is deleted (all four route files).

### Config

`next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/SaaS-dashboard",
  assetPrefix: "/SaaS-dashboard",
  devIndicators: {
    position: "bottom-right",
  },
};
```

`app/page.tsx`'s `redirect("/overview")` must be verified against a real
`next build` with `output: 'export'` — static-export docs don't call out
`redirect()` (the function, as opposed to `next.config` redirects) as
unsupported, but this needs a build+serve check rather than an assumption.

### Deployment workflow

New `.github/workflows/deploy-pages.yml`, triggered on push to `master`:
checkout → setup Node → `npm ci` → `npm run build` → upload `out/` as a
Pages artifact → `actions/deploy-pages`.

### Docs updated for accuracy

Three files currently assert the "real HTTP requests" architecture as the
project's differentiator; all three get updated to describe the new
in-browser simulated-fetch layer (still real async/Promise timing, real
loading/error/retry UX — just no network hop):

- `README.md`: add a "Live demo" link near the top
  (`https://karumnieks99.github.io/SaaS-dashboard/`), update the "Stack" and
  "Project structure" sections (`app/api/*` bullets → describe
  `lib/api/localFetch.ts`).
- `PRODUCT.md`: update the "What" line.
- `SPEC.md`: update STACK and ARCHITECTURE sections. These are flagged in
  the file's own header as the user's verbatim original text — updating them
  is a deliberate exception to that, made with the user's sign-off in this
  conversation, not a silent edit.

## Out of scope

- No changes to the dataset generation, seeded PRNG, or any visual/design
  work.
- No changes to the actual filtering/sorting/pagination *behavior* — only
  where it executes (browser instead of server).
- Custom domain setup — not requested; plain
  `karumnieks99.github.io/SaaS-dashboard/` URL.

## Verification plan

1. `npm run build` locally with the new `output: 'export'` config; confirm
   it completes without errors and produces `out/`.
2. Serve `out/` locally (e.g. `npx serve out`) and manually click through
   `/overview`, `/customers`, `/reports`: confirm KPIs, charts, customer
   table filter/sort/pagination, loading skeletons, and simulated
   failure/retry all behave the same as before the change.
3. `npm run lint` — must stay clean (portfolio requirement).
4. After the GitHub Actions workflow runs, load the live Pages URL and
   repeat the same manual click-through.
