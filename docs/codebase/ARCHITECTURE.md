# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: server-rendered Next.js App Router app with a pipeline-style data layer (adapter → cache → aggregate → view shaping) and feature-based UI folders.
- Why this classification: every source implements the same `EventSource` interface (`src/lib/events/types.ts:58-75`) and is registered in one list (`sources/index.ts:18-29`); a single cached entry point (`fetch-source.ts:43`) and one aggregator (`aggregate.ts:75`) feed per-tab shaping modules (`map-data.ts`, `calendar-data.ts`, `week-data.ts`, `venue-data.ts`).
- Primary constraints: no database, auth or API keys (CLAUDE.md); request-time data depends on the current time and admin settings, so data components call `connection()`; labels shown on server and client must render identically (hydration), stated in `src/lib/days.ts:79-80`.

### 2) System Flow

```text
page.tsx (static shell) -> <Suspense> data component -> getAllEvents() -> loadSource() per source
  -> fetchSource(id) ["use cache: remote"] -> adapter.fetchEvents() -> withCoordinates()
  -> merge + de-dupe -> *-data.ts shaping -> server or client component render
```

1. A route such as `src/app/map/page.tsx` renders a static header and wraps `MapData` in `<Suspense>`; `MapData` calls `connection()` (`map/page.tsx:35`).
2. `getAllEvents()` (`aggregate.ts:75`, wrapped in React `cache()`) reads `.data/source-settings.json` via `getSourceSettings()` and calls `loadSource()` for every source in parallel (`aggregate.ts:77`).
3. `loadSource()` races `fetchSource(id)` against a per-source timeout (`aggregate.ts:11-26, 54`) and turns failures into a `SourceStatus` (`aggregate.ts:59-64`).
4. `fetchSource()` is the remote-cached function with tags `events` and `events:<id>` and a `cacheProfile` lifetime; adapter errors are returned as `{ ok: false }` and cached for seconds (`fetch-source.ts:43-59`). Adapters may also call `fetchDetailPage()`, a second cached function using plain `"use cache"` with `cacheLife("days")` (`fetch-page.ts:12-17`).
5. Results are de-duplicated by normalized title + start minute, keeping the record with more filled fields (`aggregate.ts:28-39, 79-86`), then sorted by start.
6. Tab-specific modules shape events: `buildMapEvents` / `weekMapEvents` (map), `buildCalendarEvents` (calendar), `buildWeek` / `pickHighlights` (week), `buildVenues` (venues). Discover filters on the server (`components/events/event-results.tsx`); Map and Calendar receive all events and filter in the browser with the same `matcher()` (`lib/events/filters.ts:169`).

Admin flow: `src/app/admin/actions.ts` Server Actions write settings (`setSourceEnabled`) and call `refresh()`, or call `updateTag("events")` / `updateTag("events:<id>")` to drop cached responses.

### 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| Source adapters (`sources/*.ts`) | Upstream fetch, parsing, normalization, fixtures | Caching, timeouts, error isolation | `types.ts:53-57` |
| Tickster factory (`sources/tickster.ts`) | Turning any Tickster organizer page into a source | — | `tickster.ts:136-187`, used by `inkonst.ts`, `tickster-malmo.ts` |
| Scraping helpers (`scrape.ts`, `html.ts`, `map.ts`, `demo-dates.ts`, `http.ts`, `fetch-page.ts`) | Card discovery, Swedish date parsing, entity decoding, category mapping, Malmö time conversion, HTTP | — | files |
| Cache entry (`fetch-source.ts`) | Remote cache per source, tags, lifetimes | — | file |
| Aggregation (`aggregate.ts`) | Settings lookup, parallel fan-out, timeouts, status, de-dupe | — | file |
| Filter model (`filters.ts`) | URL params ⇄ filters, matcher, facets; also Malmö `localDay`/`localTime`, `toFilterable`, `isUpcoming` | — | file |
| View shaping (`*-data.ts`) | Per-tab serializable shapes | — | files |
| Pages (`src/app/**/page.tsx`) | Layout, Suspense boundaries, wiring | — | e.g. `map/page.tsx`; note `tonight/page.tsx:40-61` also classifies events |
| Browser state (`saved.ts`, `admin-mode.ts`) | `localStorage` stores via `useSyncExternalStore` | — | files |

### 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Adapter / Strategy (`EventSource`) | `types.ts:58`, every file in `sources/` | Uniform pipeline over different upstreams |
| Factory | `ticksterSource()` in `sources/tickster.ts:136` | Many venues sell through Tickster |
| Registry | `SOURCES`, `SOURCE_META`, `getSource()` in `sources/index.ts` | Single list of sources; client-safe metadata |
| Result-instead-of-throw | `SourceResult` in `fetch-source.ts:8-10`; `loadSource()` | Errors thrown in cache scopes are redacted in production (`fetch-source.ts:38-41`) |
| Live/fixture switch | `LIVE_MODE ? live : demo` in each live-capable adapter | Offline development with `EVENTS_LIVE=false` |
| Structure-agnostic scraping | `findCards()` in `scrape.ts:87-119` | Survives theme class-name changes |
| External store hook | `useSyncExternalStore` in `saved.ts`, `admin-mode.ts`, `event-map-view.tsx:27-29` | SSR-safe browser state |
| URL as state | `parseFilters` / `filtersToParams` / `useFilters` | Shareable filtered views across tabs |

### 5) Known Architectural Risks

- View shaping in `lib/` depends on UI type files in `components/` (`map-data.ts:3`, `calendar-data.ts:3`); changing a component's prop type changes the data layer's contract.
- Time and date logic is spread over `lib/days.ts`, `lib/events/filters.ts`, `lib/events/demo-dates.ts`, `lib/events/format.ts` and a private copy in `components/calendar/calendar-view.tsx:20-49`; a correction in one place does not reach the others. Details in `CONCERNS.md`.
- The aggregator's timeout does not cancel the underlying work: `withTimeout` rejects but `fetchSource` keeps running (no abort signal is passed in, `aggregate.ts:11-26`).
- Admin Server Actions have no access control (`actions.ts:8`), and settings live in a local JSON file that is per-instance on Vercel (`settings.ts:5-10`).

### 6) Evidence

- `src/app/layout.tsx`, `src/app/map/page.tsx`, `src/app/tonight/page.tsx`, `src/app/admin/actions.ts`
- `src/lib/events/types.ts`, `fetch-source.ts`, `fetch-page.ts`, `aggregate.ts`, `filters.ts`, `settings.ts`
- `src/lib/events/sources/index.ts`, `sources/tickster.ts`
- `src/lib/events/map-data.ts`, `calendar-data.ts`, `week-data.ts`, `venue-data.ts`
- `src/components/calendar/calendar-view.tsx`, `src/lib/days.ts`
