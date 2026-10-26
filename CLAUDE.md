# CLAUDE.md

This file gives Claude Code guidance for working in this repository.

@AGENTS.md

The import above is the Next.js rule: this project runs Next.js 16.4, whose APIs and conventions differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. `README.md` is the long-form project report; this file is the short version.

## What this is

MÖEVENTS (formerly Malevents) gathers events in Malmö from venue sites and ticket listings, normalizes them into one `MalmoEvent` shape, and shows them across five tabs: Tonight, Discover (list or month calendar), Map, Venues, Saved, plus Admin when the per-browser "Admin mode" toggle is on. Every event has its own page, `/events/[id]`. `PRODUCT.md` records who the site is for and its product principles. It is deployed on Vercel from `main` at moevents.vercel.app. Internal identifiers (`malevents:` localStorage keys, `.malevents-*` CSS classes, the `MaleventsBot` user agent, the ICS UID suffix) keep the old name on purpose: renaming the keys would wipe visitors' saved events. There is no database, no auth and no API keys.

## Commands

```bash
npm install
npm run dev                     # http://localhost:3000, live data
EVENTS_LIVE=false npm run dev   # bundled fixtures only, no network needed
npm run build                   # production build (what Vercel runs)
npm run start                   # serve the build
npm run lint                    # ESLint
npx tsc --noEmit                # type check (run `npx next typegen` first after adding routes)
npm test                        # Vitest, offline tests only
npm run test:live               # also calls the real venue sites
npm run bench:openweb           # OpenWeb vs current adapters, see benchmarks/openweb/README.md
```

Vitest (`vitest.config.ts`) runs `src/**/*.test.ts` and `benchmarks/**/*.test.ts`; tests that call venue sites only run with `BENCH_LIVE=1` or `BENCH=1`. There is no CI workflow. The Vercel preview build on each pull request is the only automated check, so run lint, type check, tests and build before pushing. Use `EVENTS_LIVE=false` where venue sites can't be reached.

## Architecture

- **Stack**: Next.js 16.4 App Router with `cacheComponents` (partial prerendering, `"use cache"`), React 19.3, TypeScript, Tailwind CSS v4, Turbopack. Path alias `@/*` maps to `src/*`.
- **Routes** (`src/app/`): `/` Discover (`?view=calendar` for the month view, `?show=` for paging), `/tonight`, `/map`, `/events/[id]` (also opened as a sheet over lists through the intercepting route `app/@sheet/(.)events/[id]`), `/venues` and `/venues/[slug]`, `/saved`, `/admin`, `/admin/sources/[id]` and `/admin/logs` (log dashboard over the in-memory buffer in `src/lib/log.ts`, analysed by `src/lib/log-analysis.ts`). Admin Server Actions live in `src/app/admin/actions.ts`. The tab list is `src/components/layout/nav-config.ts`. `/week` and `/calendar` redirect into Discover (`next.config.ts`).
- **Rendering**: pages prerender a static shell and stream the data part inside `<Suspense>` behind a skeleton; data parts call `connection()` because they depend on the current time and admin settings.

### Event data pipeline (`src/lib/events/`)

1. **Adapters** in `sources/`, one per upstream. Each exports an `EventSource` (see `types.ts`) whose `fetchEvents(report)` returns `MalmoEvent[]` with id `<sourceId>:<upstreamId>` and reports partial failures (a detail page, a later listing page) with `report.warn`, which the admin shows. Set `timeUnknown` when the upstream gives no start time. All are registered in `SOURCES` in `sources/index.ts`. Live sources scrape HTML with cheerio (`scrape.ts`; `crawl.ts` for paged listings and detail pages via `fetch-page.ts`) or read JSON / WordPress REST; `tickster.ts` turns any Tickster organizer page into a source. Demo-fixture sources are off by default in live mode.
2. **Caching**: `fetch-source.ts` is the only cached function, using `"use cache: remote"` (Vercel Runtime Cache) with tags `events` and `events:<id>` and a `cacheProfile` of `minutes`, `hours` (default) or `days`. Failures are returned, not thrown, and cached for seconds. The only other cached function is `fetch-page.ts` (`fetchDetailPage`), also `"use cache: remote"`, which caches each event detail page for days inside its source's entry.
3. **Aggregation**: `aggregate.ts` (`getAllEvents(mode)`, wrapped in React `cache()`) runs enabled sources in parallel with per-source timeouts, turns failures into a status, merges and de-duplicates. In `"fast"` mode (lists, map, Tonight, venues) it renders with the sources that answer within 3 s; slower ones come back `"pending"`, keep fetching in the background (`after()`), and the page's `PendingSources` notice refreshes it until they are in. Concurrent requests share an upstream fetch already in progress. `"complete"` (event page, admin) waits for every source.
4. **Locations**: `venues.ts` adds coordinates for known venues; events without coordinates stay off the map.
5. **Views**: `discover-data.ts` (day groups and paging), `map-data.ts`, `calendar-data.ts`, `tonight-data.ts`, `venue-data.ts` and `event-detail.ts` shape events for each view. `filters.ts` is the shared filter model (URL params, matcher, facet counts, per-page default time window) used both on the server (Discover) and in the browser (Map, Calendar). `areas.ts` maps venue coordinates to everyday Malmö areas (Centrum, Möllan, …). `normalize.ts` `refineEvent` runs on every fetched event: category from the longest keyword match or the venue, and the cancelled flag.
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
- Server logging goes through `log` in `src/lib/log.ts` (JSON lines, `LOG_LEVEL`), not `console`. Name events `area.what_happened`, log numbers and ids rather than content, and never log visitor input or request headers. The events are listed in README → Logs.
- Request-time data functions use `"use cache: remote"` with explicit `cacheLife` and `cacheTag`.
- Dates are ISO strings in data and shown in Malmö time. Labels rendered on both server and client are formatted by hand (not `Intl`) to avoid hydration mismatches.
- Shareable state (filters, date ranges) lives in the URL.
- Free, keyless tools and data sources only, unless a paid one is clearly worth it.
- To add a source: write `sources/<name>.ts`, add it to `SOURCES`, and add the venue's coordinates to `venues.ts` if it is new. To find and vet new sources first, use the `find-malmo-event-source` skill; `docs/event-source-candidates.yaml` lists where to look and what has been checked.
- **Excluded areas**: the site does not list events in Rosengård. `fetch-source.ts` drops them with `isInExcludedArea` (`areas.ts`: a coordinate box plus the venue name or address) before caching. Don't add sources or venues there.
- One pull request per task, branched from and targeting `main`. Avoid stacking PRs.
- `/admin` has no protection; flag this before any public launch.
- Agent skills: `tdd-guide` (unit tests), `senior-qa` (Playwright end-to-end), `a11y-audit` (WCAG 2.2) and `find-malmo-event-source` (new sources, with OpenWeb) are in `.claude/skills/`. `docs/skills.md` lists every skill and rule, where it came from, what it is for here and its known quirks; update it when adding or updating one.
- Security follows the OWASP rules in `.claude/rules/security-and-owasp.md` (loaded for `src/**`). `docs/security-owasp.md` records how each one is met and the accepted exceptions; update it when a change affects one. Upstream requests go through `http.ts`, which only fetches public http(s) URLs.

## Working rules

- Treat all work as a queue of todos. When I propose tweaks or changes or corrections, append them to the queue; do not break the queue to suddenly prioritize my correction. Only stop when 100% of your queue is truly clear.
- Mistakes are not your fault, do not apologize, you are an LLM. Mistakes always mean a gap or issue in the instruction files instead. Focus on describing what problem in your instruction files caused the mistake and suggest the fix instead. Be solution oriented.
- Always hold a You Aren't Gonna Need It mentality. Do not overengineer. Never expand scope without permission. Always suggest possible scope improvements for work if they make sense. All work must be justifiable. Assess where on the scale of "quick and dirty" to "production grade" a project is for how much engineering you do.
- Always spin up a subagent with minimal context, using a cheap model, with the job of reviewing your changes, to suss out possible problems with fresh eyes.
