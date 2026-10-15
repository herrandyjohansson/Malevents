# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `src/app/` | App Router routes: `/`, `/tonight`, `/map`, `/calendar`, `/week`, `/venues`, `/venues/[slug]`, `/saved`, `/admin`, `/admin/sources/[id]`; root `layout.tsx`, `error.tsx`, `globals.css`; admin Server Actions in `admin/actions.ts` | directory listing |
| `src/lib/events/` | Event pipeline: types, config, HTTP, caching, aggregation, scraping helpers, view shaping, filters, formatting | directory listing |
| `src/lib/events/sources/` | One adapter per upstream (10 files + `index.ts` registry) | `src/lib/events/sources/index.ts` |
| `src/lib/` (root files) | Cross-cutting helpers: `days.ts` (day math + hand-made labels), `ics.ts`, `saved.ts` / `saved-snapshot.ts`, `admin-mode.ts`, `utils.ts` | directory listing |
| `src/components/<feature>/` | Feature folders: `events`, `filters`, `map`, `calendar`, `tonight`, `week`, `venues`, `saved`, `admin`, `layout` | directory listing |
| `src/components/ui/` | shadcn/ui components (new-york style) | `components.json` |
| `public/` | Default Next.js SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) | scan DIRECTORY TREE |
| `.agents/skills/` | Agent tooling (this analysis skill); not application code | directory listing |
| `docs/codebase/` | These documents | — |
| `CLAUDE.md`, `AGENTS.md`, `README.md`, `ASSIGNMENT_2.md` | Agent guidance, project report, course assignment log | root listing |

### 2) Entry Points

- Main runtime entry: `src/app/layout.tsx` (root layout) and each route's `page.tsx`. The scanner reported "No common entry points found"; that is a scanner limitation for App Router projects, not an absence of entry points.
- Secondary entry points: Server Actions in `src/app/admin/actions.ts`. No workers, CLIs or cron jobs.
- How entry is selected: file-system routing under `src/app/`; scripts `dev`/`build`/`start` in `package.json` call `next`.

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `src/lib/events/sources/*` | Fetch + normalize one upstream into `MalmoEvent[]`; imports `server-only` | Caching, timeouts, error isolation (stated in `types.ts:53-57`) |
| `src/lib/events/fetch-source.ts` | The remote-cached per-source entry point | — |
| `src/lib/events/aggregate.ts` | Fan-out, timeouts, status, de-dupe | — |
| `src/lib/events/*-data.ts` | Shape events per tab (server-only) | — (but see note below) |
| `src/lib/events/filters.ts` | Client-safe filter model shared by server and browser | Server-only imports |
| `src/components/ui/` | Generic UI primitives | Event domain logic |

Observed crossings: `src/lib/events/map-data.ts:3` and `src/lib/events/calendar-data.ts:3` import types from `src/components/map/types.ts` and `src/components/calendar/types.ts` (lib → components). `src/components/map/range-calendar.tsx` is imported by `src/components/filters/filter-bar.tsx` and `filter-panel.tsx` (filters → map folder).

### 4) Naming and Organization Rules

- File naming pattern: kebab-case for all `.ts`/`.tsx` files (e.g. `event-map-view.tsx`, `fetch-source.ts`, `malmo-stadsteater.ts`); route segments follow URLs (`[slug]`, `[id]`).
- Directory organization pattern: feature-based in `components/`; pipeline-stage files in `lib/events/`.
- Import aliasing: `@/*` → `./src/*` (`tsconfig.json` paths). Inside `lib/events/` relative imports are used (`./types`, `../config`); across folders `@/` is used.
- Module names that do not match their content: `lib/events/map.ts` holds category and price text mapping (`toCategory`, `parsePriceText`), not map logic; `lib/events/demo-dates.ts` holds `malmoLocalToIso` and `malmoToday`, which live adapters use via `scrape.ts:toIso`.

### 5) Evidence

- `docs/codebase/.codebase-scan.txt` (DIRECTORY TREE, ENTRY POINTS)
- `tsconfig.json`, `components.json`
- `src/app/layout.tsx`, `src/app/admin/actions.ts`
- `src/lib/events/sources/index.ts`, `src/lib/events/map.ts`, `src/lib/events/demo-dates.ts`
- `src/lib/events/map-data.ts`, `src/lib/events/calendar-data.ts`, `src/components/filters/filter-bar.tsx`
