# GitHub Pages Static Export + Live Demo Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app deployable as a static site on GitHub Pages, and add a working live-demo link to the README.

**Architecture:** Delete the `app/api/*` server route handlers (static export can't run them) and replace their logic with an in-browser resolver (`lib/api/localFetch.ts`) that `useApi.ts` calls instead of `fetch()`. The resolver reuses the exact same dataset query functions and latency/failure simulation the route handlers used, so every calling component keeps working unchanged. Then configure `next.config.ts` for `output: 'export'` with a `basePath` scoped to GitHub Actions builds only (local `npm run dev` stays at the plain root), add a GitHub Actions workflow to build and deploy on push, and update the docs.

**Tech Stack:** Next.js 16.2.10 (App Router) static export, GitHub Actions (`actions/deploy-pages`), no test framework in this repo — verification is `npm run build`, `npm run lint`, and manual click-through (matches existing repo conventions; see `docs/superpowers/specs/2026-07-18-github-pages-static-export-design.md`).

## Global Constraints

- Single code path: no server route handlers survive; `npm run dev` and the GitHub Pages build both use `lib/api/localFetch.ts`.
- `useApi<T>(url: string)`'s public signature does not change — no calling component is touched.
- Data behavior (filtering/sorting/pagination results, 300–700ms delay, 5% failure rate) must be identical to today's, just relocated to the browser.
- `basePath`/`assetPrefix` = `/SaaS-dashboard`, applied only when `process.env.GITHUB_ACTIONS === "true"` (keeps `http://localhost:3000` working for local dev, unchanged from current README instructions).
- `npm run lint` must stay clean throughout (portfolio requirement).
- GitHub Pages deploy target: `https://karumnieks99.github.io/SaaS-dashboard/`.

---

### Task 1: Replace the API layer with an in-browser resolver

**Files:**
- Modify: `lib/api/simulate.ts`
- Create: `lib/api/localFetch.ts`
- Modify: `lib/api/useApi.ts`
- Delete: `app/api/metrics/route.ts`
- Delete: `app/api/revenue/route.ts`
- Delete: `app/api/customers/route.ts`
- Delete: `app/api/reports/route.ts`

**Interfaces:**
- Consumes: `getMetrics(): MetricsSummary`, `getRevenueSeries(months: number): RevenuePoint[]`, `getReports(): MonthlyReport[]`, `queryCustomers(q: CustomerQuery): CustomerPage` — all from `lib/data/dataset.ts` (unchanged, already exist).
- Produces: `withSimulation<T>(data: () => T): Promise<T>` (rewritten from `lib/api/simulate.ts`, now throws instead of returning a `NextResponse`). `localFetch<T>(url: string): Promise<T>` (new, from `lib/api/localFetch.ts`) — used by `useApi.ts` and nothing else.

- [ ] **Step 1: Rewrite `lib/api/simulate.ts` to drop the `NextResponse` dependency**

Replace the full file contents:

```ts
// Shared by every simulated endpoint: 300–700 ms latency, then a 5% failure rate.
// Math.random (not the dataset's seeded PRNG) is intentional — the DATA must be
// deterministic, but latency and failures should differ on every call so the
// client's loading/error/retry paths get exercised for real.

const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 700;
const FAILURE_RATE = 0.05;

export async function withSimulation<T>(data: () => T): Promise<T> {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (Math.random() < FAILURE_RATE) {
    throw new Error("Simulated upstream failure. Retry the request.");
  }

  return data();
}
```

- [ ] **Step 2: Create `lib/api/localFetch.ts`**

```ts
import { withSimulation } from "@/lib/api/simulate";
import {
  getMetrics,
  getRevenueSeries,
  getReports,
  queryCustomers,
} from "@/lib/data/dataset";
import type { CustomerSortField, CustomerStatus, Plan } from "@/lib/data/types";

// In-browser stand-in for the old `app/api/*` route handlers. Static export
// (GitHub Pages) can't run server-side route handlers that read query
// params, so the same filtering/sorting/pagination + latency/failure
// simulation now runs here, dispatched by parsing the same URL shape the
// route handlers used to receive (e.g. "/api/customers?page=2&sort=mrr").

const PLANS: readonly Plan[] = ["starter", "pro", "enterprise"];
const STATUSES: readonly CustomerStatus[] = ["active", "trialing", "churned"];
const SORT_FIELDS: readonly CustomerSortField[] = [
  "company",
  "mrr",
  "signupDate",
  "status",
];

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

export function localFetch<T>(url: string): Promise<T> {
  const [pathname, search] = url.split("?");
  const params = new URLSearchParams(search ?? "");

  switch (pathname) {
    case "/api/metrics":
      return withSimulation(() => getMetrics()) as Promise<T>;

    case "/api/revenue": {
      const monthsParam = Number(params.get("months"));
      const months = Number.isFinite(monthsParam) && monthsParam > 0 ? monthsParam : 18;
      return withSimulation(() => getRevenueSeries(months)) as Promise<T>;
    }

    case "/api/reports":
      return withSimulation(() => getReports()) as Promise<T>;

    case "/api/customers": {
      const pageParam = Number(params.get("page"));
      const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
      return withSimulation(() =>
        queryCustomers({
          page,
          pageSize: 10,
          query: params.get("query")?.trim() ?? "",
          plan: oneOf(params.get("plan"), PLANS),
          status: oneOf(params.get("status"), STATUSES),
          sort: oneOf(params.get("sort"), SORT_FIELDS) ?? "signupDate",
          dir: params.get("dir") === "asc" ? "asc" : "desc",
        })
      ) as Promise<T>;
    }

    default:
      return Promise.reject(new Error(`localFetch: unknown endpoint "${pathname}"`));
  }
}
```

- [ ] **Step 3: Update `lib/api/useApi.ts` to call `localFetch` instead of `fetch`**

Replace the full file contents:

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { localFetch } from "@/lib/api/localFetch";

export interface UseApiResult<T> {
  /** Last successful payload. Kept while a refetch is in flight so tables can
   *  show stale rows under a refresh indicator instead of collapsing. */
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

// The one data-fetching primitive of the app. Every client region calls this
// with a URL-shaped key, so the loading / error / retry story is identical
// everywhere the simulated network misbehaves.
//
// `loading` is derived, not stored: a request is in flight whenever the last
// settled result doesn't match the current url+attempt key. That keeps all
// setState calls inside async callbacks (no sync setState in the effect body).
export function useApi<T>(url: string): UseApiResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  const key = `${url}#${attempt}`;

  useEffect(() => {
    let cancelled = false;
    const requestKey = `${url}#${attempt}`;

    localFetch<T>(url)
      .then((body) => {
        if (cancelled) return;
        setSettled({ key: requestKey, data: body, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        // Carry the previous data forward so a failed refetch doesn't wipe
        // what's already on screen.
        setSettled((prev) => ({
          key: requestKey,
          data: prev?.data ?? null,
          error: message,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [url, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const loading = settled?.key !== key;

  return {
    data: settled?.data ?? null,
    loading,
    error: loading ? null : (settled?.error ?? null),
    retry,
  };
}
```

- [ ] **Step 4: Delete the four route handler files**

```bash
git rm app/api/metrics/route.ts app/api/revenue/route.ts app/api/customers/route.ts app/api/reports/route.ts
```

If `app/api/metrics`, `app/api/revenue`, `app/api/customers`, `app/api/reports` are now empty directories, they're removed automatically by `git rm` (git doesn't track empty directories).

- [ ] **Step 5: Fix a stale comment in `app/(dashboard)/customers/page.tsx`**

The file has a comment referencing the now-deleted route handler. Change lines 10–11:

```tsx
// Server component: static structure only — the table region is the client
// boundary, since search/filter/sort/pagination all talk to /api/customers.
```

to:

```tsx
// Server component: static structure only — the table region is the client
// boundary, since search/filter/sort/pagination all go through localFetch.
```

- [ ] **Step 6: Verify behavior is unchanged**

Run: `npm run dev`

Open `http://localhost:3000` and manually check:
- Redirects into `/overview`; KPI row, revenue chart, plan mix, recent signups all load (briefly showing loading skeletons, matching the old 300–700ms delay).
- `/customers`: search, plan filter, status filter, column sort, and pagination all work; occasionally (about 1 in 20 loads) you should see the error state with a working retry button.
- `/reports`: table loads, CSV export still works.

Expected: identical behavior to before this task (same delay range, same ~5% error rate, same data).

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/api/simulate.ts lib/api/localFetch.ts lib/api/useApi.ts "app/(dashboard)/customers/page.tsx"
git commit -m "$(cat <<'EOF'
refactor: move API layer from route handlers to in-browser resolver

Static export (GitHub Pages) can't run route handlers that read query
params. lib/api/localFetch.ts reuses the same dataset query functions
and latency/failure simulation the route handlers used, dispatched by
parsing the same URL shape - so every calling component is unchanged.
EOF
)"
```

---

### Task 2: Configure static export

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `npm run build` emits a static `out/` directory.

- [ ] **Step 1: Update `next.config.ts`**

Replace the full file contents:

```ts
import type { NextConfig } from "next";

// basePath only applies in the GitHub Actions build (GITHUB_ACTIONS is set
// automatically by the Actions runner) so `npm run dev` keeps working at
// the plain root, unchanged.
const isGithubActionsBuild = process.env.GITHUB_ACTIONS === "true";
const repoBasePath = "/SaaS-dashboard";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubActionsBuild ? repoBasePath : "",
  assetPrefix: isGithubActionsBuild ? repoBasePath : "",
  // Keep the dev-tools indicator out of the sidebar's corner — bottom-left
  // collides with the sidebar footer content.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
```

- [ ] **Step 2: Build and confirm static export succeeds**

Run: `npm run build`

Expected: build completes with no errors, and a `out/` directory is created containing `index.html`, `overview/index.html`, `customers/index.html`, `reports/index.html`.

If the build fails on `app/page.tsx`'s `redirect("/overview")` (static export docs don't list `redirect()` as unsupported, but this hasn't been verified against this Next version) — open `node_modules/next/dist/docs/01-app/api-reference/functions/redirect.md` for the current guidance, and if it's genuinely incompatible with `output: 'export'`, replace the file with a static meta-refresh page instead:

```tsx
export default function Home() {
  return (
    <meta httpEquiv="refresh" content="0; url=/overview" />
  );
}
```

(Only make this change if the plain `redirect()` call actually fails the build — don't pre-emptively replace it.)

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "$(cat <<'EOF'
build: configure static export for GitHub Pages

output: 'export' plus a basePath scoped to GitHub Actions builds only,
so local dev keeps running at the plain root.
EOF
)"
```

(If Step 2 required changing `app/page.tsx`, also `git add app/page.tsx` here and mention it in the commit message.)

---

### Task 3: Verify the exported site under its real subpath

**Files:** none (verification only — no code changes expected)

**Interfaces:** none.

- [ ] **Step 1: Build with the GitHub Actions env var set, to reproduce the real basePath**

```bash
GITHUB_ACTIONS=true npm run build
```

Expected: same success as Task 2 Step 2, but this time `out/`'s HTML/JS reference `/SaaS-dashboard/...` asset paths.

- [ ] **Step 2: Serve `out/` under a `/SaaS-dashboard` prefix**

GitHub Pages will host this repo's files under `/SaaS-dashboard/`, which a plain `npx serve out` at the root won't reproduce (asset requests would 404). Stage it under the right subpath first:

```bash
rm -rf /tmp/pages-preview
mkdir -p /tmp/pages-preview/SaaS-dashboard
cp -r out/* /tmp/pages-preview/SaaS-dashboard/
npx serve /tmp/pages-preview -l 4173
```

- [ ] **Step 3: Manually verify in a browser**

Open `http://localhost:4173/SaaS-dashboard/`. Confirm:
- It redirects into `/SaaS-dashboard/overview` (not a bare `/overview` — this is the basePath check).
- All CSS/JS/fonts load (no 404s in the browser console/network tab — this is the real risk with basePath misconfiguration).
- `/SaaS-dashboard/customers`: filters, sort, pagination, and the simulated error/retry state all work.
- `/SaaS-dashboard/reports`: loads and CSV export works.

Expected: identical behavior to Task 1 Step 5's manual check, just under the `/SaaS-dashboard` prefix.

- [ ] **Step 4: Stop the preview server and clean up**

Stop the `npx serve` process (Ctrl+C), then:

```bash
rm -rf /tmp/pages-preview
```

No commit for this task — it's verification only, confirming Task 2's config is correct before wiring up automated deployment.

---

### Task 4: Add the GitHub Actions deployment workflow

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Consumes: `npm run build` (from `package.json`, unchanged) producing `out/` (from Task 2).
- Produces: a live deployment triggered on every push to `master`.

- [ ] **Step 1: Create `.github/workflows/deploy-pages.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["master"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Validate the YAML is well-formed**

Run: `npx -y js-yaml .github/workflows/deploy-pages.yml`
Expected: prints the parsed structure with no error (confirms valid YAML syntax before pushing — this workflow can't be run locally).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "$(cat <<'EOF'
ci: add GitHub Actions workflow to deploy to GitHub Pages

Builds the static export and deploys via actions/deploy-pages on every
push to master.
EOF
)"
```

---

### Task 5: Update docs for accuracy and add the live demo link

**Files:**
- Modify: `README.md`
- Modify: `PRODUCT.md`
- Modify: `SPEC.md`

**Interfaces:** none (docs only).

- [ ] **Step 1: Update `README.md`**

Replace lines 1–19 (from the `# Pulse` heading through the end of the "Stack" paragraph):

```markdown
# Pulse

Repo: https://github.com/Karumnieks99/SaaS-dashboard
Live demo: https://karumnieks99.github.io/SaaS-dashboard/

A portfolio-grade SaaS analytics dashboard for a fictional B2B product.
Three views — business overview, customer directory, monthly reports — where
every number on screen traces back to a single seeded dataset, and every
fetch behaves like a real network call (simulated latency, simulated
failures, retry) — all running client-side so the whole app is a static
export deployable to GitHub Pages.

See [`SPEC.md`](./SPEC.md) and [`PRODUCT.md`](./PRODUCT.md) for the full spec
and product framing.

## Stack

Next.js (App Router) + TypeScript + Tailwind, charts via Recharts. No
database and no server at runtime — `lib/api/localFetch.ts` resolves
requests in-browser against `lib/data/dataset.ts`, the single source of
truth, with 300–700ms simulated latency and a 5% simulated failure rate
baked into every call.
```

Update the "Project structure" section's route-handler bullet (originally lines 40–42):

```markdown
- `lib/api/localFetch.ts` — in-browser resolver standing in for a real API:
  parses a URL-shaped string (e.g. `/api/customers?page=2&sort=mrr`) and
  dispatches to `lib/data/dataset.ts`, doing real filtering/sorting/
  pagination. `/api/customers` supports `page`, `query`, `plan`, `status`,
  `sort`, `dir`.
```

Update the `lib/api/simulate.ts` bullet (originally line 47–48) to remove "route handler" phrasing:

```markdown
- `lib/api/simulate.ts` — shared latency/failure simulation used by every
  call through `localFetch`.
```

- [ ] **Step 2: Update `PRODUCT.md`**

Change line 3's "What" bullet from asserting real HTTP calls to describing the in-browser simulation:

```markdown
- **What**: Portfolio-grade analytics dashboard for a fictional B2B SaaS — business overview, customer directory, monthly reports. Every number traces to one seeded dataset; every fetch behaves like a real network call (simulated latency and failures), resolved in-browser so the app ships as a static export on GitHub Pages.
```

- [ ] **Step 3: Update `SPEC.md`**

Replace the `## STACK` section (lines 7–13):

```markdown
## STACK

Next.js 14+ (App Router) + TypeScript + Tailwind. Recharts for charts.
Deployed as a static export to GitHub Pages. No database and no server at
runtime — the mock API lives in `lib/api/localFetch.ts`, an in-browser
resolver returning data from the source-of-truth dataset module, with
300–700ms simulated latency and a 5% simulated failure rate, so every fetch
still has real async timing and real loading/error/retry states, just
without a network hop.

> Note: this section originally described server-side `app/api/*` route
> handlers doing real HTTP round trips. It was updated on 2026-07-18 to
> reflect the move to a static export for GitHub Pages hosting — see
> `docs/superpowers/specs/2026-07-18-github-pages-static-export-design.md`.
```

Update the "API endpoints" bullet list inside `## DATA LAYER` (originally lines 35–43), changing only the `/api/customers` line's parenthetical (server-side → in-browser) and the final `lib/api/simulate.ts` line:

```markdown
- API endpoints (all GET-shaped, resolved in-browser via `lib/api/localFetch.ts`):
  - `/api/metrics` → KPI summary
  - `/api/revenue?months=N` → time series
  - `/api/customers?page&query&plan&status&sort&dir` → filtered/sorted/paginated list
    (filtering happens in the resolver, so table interactions still go
    through the same async delay/failure/retry path a real round trip would)
  - `/api/reports` → monthly summaries
- `lib/api/simulate.ts` is shared by every call through `localFetch`: random
  300–700 ms delay, then a 5% chance of throwing an error.
```

Update the `## ARCHITECTURE` section's second bullet (originally lines 50–52):

```markdown
- Use server components for the static shell; data regions are client
  components fetching through `lib/api/localFetch.ts` — keep the boundary
  deliberate and commented, not accidental
```

- [ ] **Step 4: Commit**

```bash
git add README.md PRODUCT.md SPEC.md
git commit -m "$(cat <<'EOF'
docs: update architecture description and add live demo link

README/PRODUCT/SPEC described app/api/* route handlers doing real HTTP
round trips; that's no longer accurate now that the API layer runs
in-browser for the GitHub Pages static export.
EOF
)"
```

---

### Task 6: Deploy and verify the live site

**Files:** none (operational task).

**Interfaces:** none.

- [ ] **Step 1: Push to master**

```bash
git push origin master
```

- [ ] **Step 2: Enable GitHub Pages with the Actions build source**

Show this command to the user before running it (changes a repo setting):

```bash
gh api -X POST repos/Karumnieks99/SaaS-dashboard/pages -f build_type=workflow
```

If it fails because Pages is already enabled on this repo (HTTP 409), use the update endpoint instead:

```bash
gh api -X PUT repos/Karumnieks99/SaaS-dashboard/pages -f build_type=workflow
```

- [ ] **Step 3: Watch the workflow run**

```bash
gh run watch --exit-status
```

Expected: the `Deploy to GitHub Pages` workflow completes both `build` and `deploy` jobs successfully.

If it fails, run `gh run view --log-failed` to see the failing step's output before making any further changes.

- [ ] **Step 4: Verify the live URL**

Fetch `https://karumnieks99.github.io/SaaS-dashboard/` and confirm:
- It loads and redirects into `/SaaS-dashboard/overview`.
- KPI cards, chart, and plan mix render with real numbers (not blank/error).
- `/SaaS-dashboard/customers` filtering/sorting/pagination works.
- No 404s for JS/CSS assets in the browser network tab.

This mirrors Task 3's local check, now against the real deployment — Task 3 exists specifically so any basePath issues are caught before this point, but this is the first time it's checked against GitHub's actual infrastructure (CDN caching, real TLS, etc.), so don't skip it.

- [ ] **Step 5: No commit needed** — this task only pushes and verifies infrastructure already committed in Tasks 1–5.
