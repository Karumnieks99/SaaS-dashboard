# Pulse

- **What**: Portfolio-grade analytics dashboard for a fictional B2B SaaS — business overview, customer directory, monthly reports. Every number traces to one seeded dataset; every fetch behaves like a real network call (simulated latency and failures), resolved in-browser so the app ships as a static export on GitHub Pages.
- **Audience**: Portfolio reviewers and the founder persona the demo plays: someone glancing at an always-on revenue monitor, not reading a report.
- **Register**: product — design serves the task; density and consistency over spectacle.
- **Design direction**: committed dark "monitor" theme (see `SPEC.md` DESIGN). Green-cast deep-ink surfaces, phosphor-teal accent reserved for data/live state, steel-blue ordinal ramp for plan tiers, status colors reserved for status. Signature element: the hero MRR card's EKG sparkline with a live blip; everything else stays quiet.
- **Type roles**: Geist Sans (UI chrome) · Spline Sans Mono (all numerals — the data voice) · Bricolage Grotesque (identity: wordmark, page titles).
- **Constraints**: Next.js App Router conventions as committed (server shell, client data regions, per-route loading/error). Light/dark follows the app's pinned dark scheme, not the OS. Tokens in `app/globals.css` are the single source of truth.
