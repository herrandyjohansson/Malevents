# CLAUDE.md

This file gives Claude Code guidance for working in this repository.

@AGENTS.md

The import above is the Next.js rule: this project runs Next.js 16.4, whose APIs and conventions differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. `README.md` is the long-form project report; this file is the short version.

## What this is

Malevents gathers events in Malmö from venue sites and ticket listings, normalizes them into one `MalmoEvent` shape, and shows them across tabs: Discover, Tonight, Map, Calendar, Week, Venues, Saved, plus Admin when the per-browser "Admin mode" toggle is on. It is deployed on Vercel from `main`. There is no database, no auth and no API keys.

## Commands

```bash
npm install
npm run dev                     # http://localhost:3000, live data
EVENTS_LIVE=false npm run dev   # bundled fixtures only, no network needed
npm run build                   # production build (what Vercel runs)
npm run start                   # serve the build
npm run lint                    # ESLint
npx tsc --noEmit                # type check (run `npx next typegen` first after adding routes)
```

There is no test framework and no CI workflow. The Vercel preview build on each pull request is the only automated check, so run lint, type check and build before pushing. Use `EVENTS_LIVE=false` where venue sites can't be reached.

## Architecture

- **Stack**: Next.js 16.4 App Router with `cacheComponents` (partial prerendering, `"use cache"`), React 19.3, TypeScript, Tailwind CSS v4, Turbopack. Path alias `@/*` maps to `src/*`.
- **Routes** (`src/app/`): `/` Discover, `/tonight`, `/map`, `/calendar`, `/week`, `/venues` and `/venues/[slug]`, `/saved`, `/admin` and `/admin/sources/[id]`. Admin Server Actions live in `src/app/admin/actions.ts`. The tab list is `src/components/layout/nav-config.ts`.
- **Rendering**: pages prerender a static shell and stream the data part inside `<Suspense>` behind a skeleton; data parts call `connection()` because they depend on the current time and admin settings.

### Event data pipeline (`src/lib/events/`)

1. **Adapters** in `sources/`, one per upstream. Each exports an `EventSource` (see `types.ts`) whose `fetchEvents()` returns `MalmoEvent[]` with id `<sourceId>:<upstreamId>`. All are registered in `SOURCES` in `sources/index.ts`. Live sources scrape HTML with cheerio (`scrape.ts`, `fetch-page.ts`) or read JSON / WordPress REST; `tickster.ts` turns any Tickster organizer page into a source. Demo-fixture sources are off by default in live mode.
2. **Caching**: `fetch-source.ts` is the only cached function, using `"use cache: remote"` (Vercel Runtime Cache) with tags `events` and `events:<id>` and a `cacheProfile` of `minutes`, `hours` (default) or `days`. Failures are returned, not thrown, and cached for seconds.
3. **Aggregation**: `aggregate.ts` (`getAllEvents()`, wrapped in React `cache()`) runs enabled sources in parallel with per-source timeouts, turns failures into a status, merges and de-duplicates.
4. **Locations**: `venues.ts` adds coordinates for known venues; events without coordinates stay off the map.
5. **Views**: `map-data.ts`, `calendar-data.ts`, `week-data.ts` and `venue-data.ts` shape events for each tab. `filters.ts` is the shared filter model (URL params, matcher, facet counts) used both on the server (Discover) and in the browser (Map, Calendar).
6. **Admin**: `settings.ts` stores source on/off in `.data/source-settings.json` (does not persist on Vercel). Refresh actions call `updateTag`.

`config.ts` holds `LIVE_MODE` (`EVENTS_LIVE`), the `Europe/Stockholm` time zone and the default source timeout.

### UI

- `src/components/ui/`: shadcn/ui components (new-york style, Radix primitives via `radix-ui`, configured in `components.json`), copied in and edited like normal code. Add more with `npx shadcn@latest add <component>`.
- Feature folders in `src/components/`: `events`, `filters` (shared URL-backed filter bar, `use-filters.ts`), `map`, `calendar`, `tonight`, `week`, `venues`, `saved`, `admin`, `layout`.
- Tailwind v4 is configured in CSS (`src/app/globals.css`), not a `tailwind.config` file, and compiled through the `@tailwindcss/turbopack` loader in `next.config.ts`. Dark theme only.
- **Maps**: Leaflet client components (`components/map/leaflet-map.tsx`) with `leaflet.markercluster`. The basemap (`components/map/basemap.ts`) is the keyless OpenFreeMap "Fiord" vector style drawn with MapLibre, falling back to OSM raster tiles darkened in CSS when WebGL or OpenFreeMap is unavailable.
- **Saved** events and **Admin mode** are browser `localStorage` (`lib/saved.ts`, `lib/admin-mode.ts`) read through `useSyncExternalStore`.

## Conventions

- Adapters and anything touching settings or secrets import `server-only`.
- Request-time data functions use `"use cache: remote"` with explicit `cacheLife` and `cacheTag`.
- Dates are ISO strings in data and shown in Malmö time. Labels rendered on both server and client are formatted by hand (not `Intl`) to avoid hydration mismatches.
- Shareable state (filters, date ranges) lives in the URL.
- Free, keyless tools and data sources only, unless a paid one is clearly worth it.
- To add a source: write `sources/<name>.ts`, add it to `SOURCES`, and add the venue's coordinates to `venues.ts` if it is new.
- One pull request per task, branched from and targeting `main`. Avoid stacking PRs.
- `/admin` has no protection; flag this before any public launch.
