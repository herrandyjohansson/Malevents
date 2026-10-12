# Malevents

What's on in Malmö: one site that gathers events from many venue sites and ticket listings, cleans them into one shape, and shows them as cards, on a map and in a calendar.

This README is the project's summary report: what the site does, how the code is laid out, which libraries it uses, how data flows from the venue sites to the page, how it is deployed on Vercel, and how work on it is done.

> **Not protected yet.** There is no login anywhere, by choice while the site is being built. The Admin tab is hidden behind an "Admin mode" button, but `/admin` and its actions are open to anyone who knows the URL: anyone can switch sources off or clear the cache. Add protection (for example Vercel Deployment Protection, or auth in front of `/admin` and its Server Actions) before a public launch.

## Contents

1. [At a glance](#at-a-glance)
2. [What the site does](#what-the-site-does)
3. [Filters](#filters)
4. [Tech stack](#tech-stack)
5. [Project structure](#project-structure)
6. [How event data flows](#how-event-data-flows)
7. [Event sources](#event-sources)
8. [Pages and components](#pages-and-components)
9. [Styling and UI components](#styling-and-ui-components)
10. [Configuration](#configuration)
11. [Running it locally](#running-it-locally)
12. [Deployment on Vercel](#deployment-on-vercel)
13. [Development workflow](#development-workflow)
14. [Known limits and next steps](#known-limits-and-next-steps)

## At a glance

| | |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Cache Components, Turbopack), React 19.3, TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui components (new-york style, Radix primitives), lucide icons, dark theme only |
| Map | Leaflet with the standard OpenStreetMap tiles (no API key), darkened with CSS |
| Data | 10 source adapters (7 live venue and ticket sites, 3 demo fixtures), scraped or read from JSON, normalized into one `MalmoEvent` type |
| Caching | `"use cache: remote"` per source (Vercel Runtime Cache), served stale while refreshing in the background |
| Hosting | Vercel, deployed from GitHub (production from `main`, a preview per pull request) |
| Auth | None (see the note above) |
| API keys | None needed |

## What the site does

- **Discover** (`/`): a hero with "This weekend" and "Explore the map" shortcuts and a small map of the coming week, then all upcoming events as image cards under the shared filter bar (see [Filters](#filters)). Cards show image, time, venue, price, and a Tickets link or "Sold out" when the source gives one.
- **Map** (`/map`): the same filters, plus a month calendar you drag across to pick dates, and pins colored by category. On phones the map fills the screen, with filter chips floating on top (the rest in a bottom sheet) and a swipe-up sheet listing the events.
- **Calendar** (`/calendar`): a full-page month calendar under the same filter bar.
- **Week** (`/week`): the next seven days. A coverflow reel of picks (one per category, with a picture) tilts as you scroll, then a planner board puts each day in its own column with a category-mix bar and a compact time-ordered list. On phones each column is a screen wide and you swipe between days; chips above jump to a day.
- **Admin** (`/admin`): shown in the tabs when "Admin mode" is switched on in the header. Per source: health, event count, last fetch, response time and cache lifetime; refresh one source or all; switch a source off for visitors without a deploy; and `/admin/sources/[id]` drills into a source's normalized events and flags events without a map location.

## Filters

Discover, Map and Calendar share one filter bar, and every choice is a button you can see and tap:

- **When**: a segmented control (Any time, Today, Tonight, Weekend, 7 days, 30 days, Pick dates). "Pick dates" folds a drag-to-select calendar open in the bar.
- **Categories**: chips with live counts (how many events you'd get with that category picked).
- **Free only** and **Hide exhibitions**: chips with a small switch inside.
- **Sources**: folds open as a row of chips with counts.

Filters live in the URL (`q`, `cat`, `src`, `when` or `from`/`to`, `free`, `nolong`), so links are shareable and the Discover, Map and Calendar tabs carry them over. Discover filters on the server; Map and Calendar filter in the browser with the same functions from `src/lib/events/filters.ts`. Older `?category=`, `?source=` and map `?from=&to=` links still work. On the phone map the bar becomes a row of floating chips with the rest in a bottom sheet.

## Tech stack

| Package | Used for |
| --- | --- |
| `next` 16.4 | App Router, Server Components, `"use cache"` / Cache Components, Server Actions, `next/font` (Geist) |
| `react`, `react-dom` 19.3 | UI; `useSyncExternalStore` for the admin-mode toggle |
| `tailwindcss` v4 + `@tailwindcss/turbopack` | Styling; CSS is compiled through a Turbopack loader rule in `next.config.ts` |
| `tw-animate-css` | Animation utilities used by the shadcn/ui components |
| `radix-ui` | Accessible primitives behind the dialog, select and switch components |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Component variants and the `cn()` helper in `src/lib/utils.ts` |
| `lucide-react` | Icons |
| `leaflet` (+ `@types/leaflet`) | The interactive maps |
| `cheerio` | Parsing HTML from venue sites that have no JSON API |
| `server-only` | Keeps adapters, caching and settings code out of client bundles |
| `eslint` 9 + `eslint-config-next` | Linting (`npm run lint`) |

There is no database, no test framework and no CI workflow in the repo; Vercel's build is the check that runs on every pull request.

## Project structure

```
.
├── AGENTS.md                 Note for coding agents: read the Next.js docs in node_modules/next/dist/docs/
├── components.json           shadcn/ui config (new-york, neutral, CSS variables, lucide)
├── next.config.ts            cacheComponents, partialPrefetching, staleTimes, Tailwind loader
├── eslint.config.mjs
├── tsconfig.json             "@/*" → src/*
├── public/                   static assets
└── src/
    ├── app/                  routes (App Router)
    │   ├── layout.tsx        html shell, Geist fonts, dark color scheme, aurora Backdrop, SiteHeader
    │   ├── globals.css       Tailwind v4 theme tokens, dark palette, map tile darkening, effects
    │   ├── page.tsx          /            Discover
    │   ├── map/page.tsx      /map         Map
    │   ├── calendar/page.tsx /calendar    Calendar
    │   ├── week/page.tsx     /week        Week
    │   ├── admin/
    │   │   ├── page.tsx                  /admin               source overview
    │   │   ├── sources/[id]/page.tsx     /admin/sources/:id   one source's events
    │   │   └── actions.ts                Server Actions: toggle, refresh one, refresh all
    │   └── error.tsx         error boundary
    ├── components/
    │   ├── layout/           site-header (+ aurora Backdrop), logo, page-header, nav-config (tab list), nav-tabs (desktop pill tabs, phone tab bar, Admin mode toggle)
    │   ├── events/           event-card, event-art (image over a category-colored placeholder), event-results, spotlight-list, skeletons, source-status
    │   ├── map/              leaflet-map, event-map-view, range-calendar, week-map preview/card, legend, day helpers
    │   ├── filters/          the shared filter bar: inline buttons (filter-bar), phone-map filter sheet (filter-panel), search box, useFilters (URL state)
    │   ├── calendar/         calendar-view
    │   ├── week/             highlight-reel (coverflow), week-board (day columns), scroll-buttons
    │   ├── admin/            source-controls, status-badge
    │   └── ui/               shadcn/ui: alert, badge, button, card, dialog, input, segmented-control, select, sheet, skeleton, switch, table
    └── lib/
        ├── utils.ts          cn()
        ├── admin-mode.ts     per-browser Admin mode flag (localStorage)
        └── events/
            ├── types.ts          MalmoEvent, EventSource, SourceStatus, categories
            ├── config.ts         EVENTS_LIVE, time zone (Europe/Stockholm), default timeout
            ├── sources/          one adapter per upstream; index.ts is the registry
            ├── fetch-source.ts   the one cached entry point per source
            ├── aggregate.ts      fan-out, timeouts, failure isolation, de-duplication
            ├── settings.ts       admin on/off per source (.data/source-settings.json)
            ├── filters.ts        the shared filter model: URL params ↔ filters, matcher, facet counts; Malmö-local days
            ├── map-data.ts       events → map pins (week preview and date ranges)
            ├── calendar-data.ts  events → calendar entries
            ├── week-data.ts      events → seven day columns and the picks reel
            ├── venues.ts         coordinates for known Malmö venues
            ├── http.ts           fetch with timeout, MaleventsBot user agent, SourceError
            ├── fetch-page.ts     cached fetch of event detail pages
            ├── scrape.ts         cheerio helpers: card finding, Swedish date parsing
            ├── jsonld.ts         schema.org Event (JSON-LD) parsing
            ├── html.ts, format.ts  text cleanup and display formatting
            └── demo-dates.ts     dates for fixtures, relative to today
```

## How event data flows

```
venue site / API ──► adapter (sources/*.ts) ──► fetchSource()  "use cache: remote", tagged events:<id>
                                                     │
                                                     ▼
                       getAllEvents()  (aggregate.ts, React cache() per request)
                       • reads admin on/off settings
                       • runs every enabled source in parallel, each with its own timeout
                       • failures become a status, never a crash
                       • merges and de-duplicates
                                                     │
              ┌──────────────────────┬───────────────┴──────────┬───────────────────┐
              ▼                      ▼                          ▼                   ▼
        / (filters on server)   /map (map-data.ts)     /calendar (calendar-data)   /admin (statuses)
```

1. **Adapters.** Each file in `src/lib/events/sources/` knows one upstream. Its `fetchEvents()` fetches JSON or HTML and maps it into `MalmoEvent` (id `<source>:<upstream id>`, title, start and end as ISO strings, category, venue, price, `isFree`, image, URL, ticket URL, sold out, notes). The rest of the app only sees that shape.
2. **Caching.** `fetch-source.ts` is the only cached function. Each source has its own entry and the tags `events` and `events:<id>`. Lifetimes come from the source's `cacheProfile`:

   | Profile | Refreshes in the background every | Stale copy may be served for |
   | --- | --- | --- |
   | `minutes` | 1 minute | 1 day |
   | `hours` (default) | 1 hour | 7 days |
   | `days` | 1 day | 30 days |

   The long expiry means visitors get the cached copy immediately while a slow scrape runs behind the scenes. A failure is cached for seconds only, and is returned rather than thrown so the real error message reaches the admin in production.
3. **Aggregation.** `getAllEvents()` runs all enabled sources with a per-source timeout (8 s by default; 30–45 s for the scraped sites), records a status per source, and merges events. Events with the same normalized title and start minute are de-duplicated, keeping the richer record. It is wrapped in React's `cache()` so the home page's map and list share one lookup.
4. **Locations.** Adapters pass through coordinates when the upstream has them; otherwise `venues.ts` looks up the venue name in a list of known Malmö venues. Events still without coordinates are left off the map and flagged in the admin.
5. **Rendering.** Pages keep a static shell (header, intro) that is prerendered, and stream the data-dependent part behind a skeleton inside `<Suspense>`. Data parts call `connection()` because they depend on the current time and the admin settings.
6. **Admin actions.** `src/app/admin/actions.ts` holds Server Actions: switching a source on or off writes `settings.ts` and calls `refresh()`; refreshing calls `updateTag("events:<id>")` or `updateTag("events")` so the next request fetches fresh data.

## Event sources

| Source | Type | Cache | Default |
| --- | --- | --- | --- |
| Malmö Live Konserthus | JSON feed | hours | on |
| Slagthuset | WordPress REST | hours | on |
| Moriska Paviljongen | HTML + WordPress REST | hours | on |
| Malmö Opera | HTML | hours | on |
| Malmö Stadsteater | HTML | hours | on |
| Inkonst (Tickster organizer page) | HTML | hours | on |
| Tickster · Malmö (city listing) | HTML | hours | on |
| Malmö stad | demo fixture | hours | off in live mode |
| Ticket marketplace | demo fixture | minutes | off in live mode |
| Skåne culture | demo fixture | days | off in live mode |

### Venue sources

None of these venues offers a documented, keyless API, so each adapter uses the most structured public data the site itself loads. Requests send a `MaleventsBot` user agent and are cached for hours.

| Source | Method | Endpoint |
| --- | --- | --- |
| Malmö Live Konserthus (Clarion Hotel & Congress Malmö Live building) | JSON feed behind the site's own programme listing, one row per performance | `https://malmolive.se/api/events` |
| Slagthuset | Open WordPress REST API (headless WP behind the Next.js site), `events` post type with ACF fields | `https://wp.slagthuset.se/wp-json/wp/v2/events` |
| Moriska Paviljongen | Programme pages scraped for dates (the REST API omits them), joined on the event link with the WordPress REST API for title, text and image, then each event page for the year, price and Nortic ticket link | `https://moriskapaviljongen.se/biljetter-program-2/` + `/wp-json/wp/v2/mp_event` |
| Malmö Opera | Server-rendered calendar (one row per performance, `?page=N`), plus each production page's Open Graph image and text. Touring dates sold via Riksteatern are skipped. | `https://www.malmoopera.se/malmo-opera` |
| Malmö Stadsteater | Server-rendered calendar (about five months ahead, one page) for Hippodromen, Intiman, Studion and Verkstan; rows without their own date take the day heading above them. Production pages add image and text. | `https://www.malmostadsteater.se/kalender` |
| Tickster · Malmö | Tickster's city listing sorted by start date (about 300 events across Babel, Grand Malmö, Ungdomens Hus, clubs, comedy …), with each event page for time, price and image. Venue comes from each event's place text. | `https://www.tickster.com/se/sv/events/in/malm%C3%B6` |
| Inkonst | Its public Tickster organizer page (the event date is in each link), plus each Tickster event page for start time, price and image. `sources/tickster.ts` turns any Tickster organizer page into a source. | `https://www.tickster.com/se/sv/events/by/bkz8z545crn3x5m/inkonst` |

HTML is parsed with [cheerio](https://cheerio.js.org/). `scrape.ts` finds event "cards" by their links rather than by theme class names, and parses Swedish dates ("fre 9 okt 19.00", "26 november 2026 | 18:30"), inferring the year when a listing leaves it out. Detail pages go through `fetchDetailPage`, which caches each page for days, so an hourly refresh only fetches pages for events it hasn't seen; at most 3–4 are fetched at once.

### Live and demo data

Sources with a live endpoint fetch it by default. Sources that only have demo fixtures start switched off in live mode, so made-up events never mix with real ones; the admin can switch them on. With `EVENTS_LIVE=false`, every source serves bundled fixtures in its upstream's real shape (marked "demo" in the UI), with dates relative to today.

### Adding a source

1. Create `src/lib/events/sources/<name>.ts` with a `fetchEvents` function that returns `MalmoEvent[]`. Use `malmo-live.ts` or `slagthuset.ts` as a model for a JSON API, `moriska.ts` or `malmo-opera.ts` for scraping, `tickster.ts` for any Tickster organizer page, and `jsonld.ts` for sites that publish schema.org JSON-LD. Caching, timeouts and error handling are applied for you.
2. Export an `EventSource` object (id, name, homepage, description, kind, endpoint, optional `cacheProfile` and `timeoutMs`) and add it to `SOURCES` in `sources/index.ts`.
3. If the venue isn't known yet, add its coordinates to `venues.ts` so its events show on the map.
4. Put any API key in an environment variable and read it inside the adapter only (adapters are `server-only`). The project prefers keyless sources.

## Pages and components

| Route | File | Main components | Rendering |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | `PageHeader`, `WeekMapPreview` (7-day map), `EventResults` → `FilterBar`, `SpotlightList` + `EventCard`, `SourceStatus` | Static shell; filters read from search params and applied on the server |
| `/map` | `app/map/page.tsx` | `EventMapView` → `FilterBar`, `RangeCalendar`, `LeafletMap`, `MapLegend` | Server prepares pins; filters and range are client-side and written to the URL with `history.replaceState` |
| `/calendar` | `app/calendar/page.tsx` | `CalendarView` → `FilterBar` | Server prepares entries; filters run in the browser |
| `/week` | `app/week/page.tsx` | `HighlightReel`, `WeekBoard` | Request-time, server-rendered; the coverflow tilt is a CSS scroll-driven animation, the only client code is the arrow buttons |
| `/admin` | `app/admin/page.tsx` | `StatusBadge`, `SourceToggle`, `RefreshSourceButton`, `RefreshAllButton`, shadcn `Table`/`Card` | Request-time; `robots: noindex` |
| `/admin/sources/[id]` | `app/admin/sources/[id]/page.tsx` | event table for one source | Request-time |

Shared pieces:

- `SiteHeader`, `Logo` and `NavTabs` (`components/layout/`) render the header, the tabs and the Admin mode button. The tab list lives in `nav-config.ts`. On desktop the tabs are a row with a sliding active pill; on phones they move to a fixed bottom tab bar like a native app (rendered outside the header, whose backdrop blur would trap a fixed child; `--tabbar-h` in `globals.css` pads the page above it). Admin mode is a `localStorage` flag read through `useSyncExternalStore` (`lib/admin-mode.ts`); it only shows or hides the tab.
- `LeafletMap` is a client component that loads Leaflet in the browser, draws category-colored pins and keeps the OSM attribution. `globals.css` inverts `.malevents-map .leaflet-tile-pane` to make the light tiles dark.
- `Backdrop` (in the root layout) draws the slowly drifting aurora behind every page, and `PageHeader` gives each tab the same eyebrow, title and description.
- `EventCard` is image-led: `EventArt` shows the event's picture over a category-colored gradient with an emoji, which also covers images that fail to load. Cards have a cursor "spotlight" hover effect and skeletons a shimmer, both hand-written in Tailwind and CSS.

## Styling and UI components

- **Tailwind v4** is configured in CSS, not in a `tailwind.config` file: `src/app/globals.css` imports Tailwind and `tw-animate-css` and declares the theme tokens (colors, radius, fonts) as CSS variables. Turbopack compiles it through the `@tailwindcss/turbopack` loader set in `next.config.ts`.
- **Dark theme only.** `<html>` always has the `dark` class and the viewport declares `colorScheme: "dark"`; there is no light theme or theme switch.
- **shadcn/ui** components are copied into `src/components/ui/` (configured by `components.json`) and edited like any other code. They build on Radix primitives from the `radix-ui` package. Add more with `npx shadcn@latest add <component>`.
- **Fonts**: Geist and Geist Mono through `next/font/google`.

## Configuration

| Setting | Where | Effect |
| --- | --- | --- |
| `EVENTS_LIVE=false` | env var | Every adapter serves its fixtures instead of calling the live site (for offline work or sandboxes that can't reach the venue sites). Unset means live. |
| `DEMO_SOURCE_FAILURE=true` | env var | Makes the Skåne culture source fail, to see how the page degrades. |
| `cacheComponents: true` | `next.config.ts` | Turns on `"use cache"`, `cacheLife`, `cacheTag` and partial prerendering. |
| `partialPrefetching: true` | `next.config.ts` | Prefetches only the static part of linked pages. |
| `experimental.staleTimes.dynamic: 30` | `next.config.ts` | Keeps visited pages in the browser's router cache for 30 s, so switching tabs doesn't re-request them. |
| Source on/off | `/admin` → `.data/source-settings.json` | Git-ignored file written by the admin toggle (see limits below). |

No environment variables are required; `.env*` files are git-ignored if you add any.

## Running it locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev          # http://localhost:3000, live data
EVENTS_LIVE=false npm run dev   # demo fixtures only, no network needed
```

Other scripts:

```bash
npm run build        # production build (what Vercel runs)
npm run start        # serve the build
npm run lint         # ESLint
npx tsc --noEmit     # type check (run `npx next typegen` first after adding routes)
```

The first request with live data is slow because every venue site is scraped; after that the cache answers.

## Deployment on Vercel

The site runs on Vercel, connected to this GitHub repository through Vercel's Git integration. There is no `vercel.json` and no GitHub Actions workflow: Vercel detects Next.js and uses its defaults (`npm install`, `next build`).

- **Production** is built and deployed automatically on every push to `main`, which in practice means every merged pull request.
- **Preview deployments** are built for every pull request branch. The Vercel check on the pull request is the project's only CI: a failed build shows up there. Previews sit behind Vercel's login (Deployment Protection), so only signed-in team members can open them.
- **Rendering on Vercel.** Static shells are prerendered at build time and served from the CDN. Request-time parts run as serverless Vercel Functions.
- **Runtime Cache.** `fetchSource` uses `"use cache: remote"`, which on Vercel is stored in Vercel's Runtime Cache, shared by all function instances and provided automatically (no setup or keys). Plain in-memory `"use cache"` would be per instance, so every cold instance would re-scrape every venue site. Entries are keyed per build, so the first visits after a new deployment do a cold fetch (up to the source timeouts), and later visits are served from cache while refreshing in the background.
- **Refreshing data.** Data refreshes on its own per the cache profiles. To force it, use "Refresh" in `/admin`, which clears the source's cache tag.
- **Environment variables.** None are needed in production. `EVENTS_LIVE=false` can be set in the Vercel project settings to make a deployment use demo data.
- **Admin settings don't persist on Vercel.** `settings.ts` writes a JSON file, and Vercel Functions have a read-only, per-instance file system, so toggling a source off doesn't stick in production. Swapping `settings.ts` for a key-value store (for example Upstash Redis or Edge Config from the Vercel Marketplace, keeping the same two functions) fixes this.
- **Rolling back.** Promote an earlier deployment in the Vercel dashboard (Deployments → ⋯ → Promote / Instant Rollback), or revert the merge on `main`.

## Development workflow

1. **One pull request per task.** Each change is made on its own branch (`claude/<task>-<id>` for changes made by Claude in the project) and opened as a pull request against `main`.
2. **Check before pushing.** Run `npm run lint`, `npx tsc --noEmit` and `npm run build` locally. Use `EVENTS_LIVE=false` where the venue sites can't be reached.
3. **Preview.** Vercel builds a preview of the branch; the PR's Vercel check must be green.
4. **Review and merge.** Merging into `main` deploys to production.
5. **Next.js version.** This project uses Next.js 16.4, which differs from older versions in APIs and conventions. Read the guides in `node_modules/next/dist/docs/` before writing Next.js code (see `AGENTS.md`).

Conventions worth keeping:

- Data functions that run at request time use `"use cache: remote"` with explicit `cacheLife` and `cacheTag`.
- Adapters and anything that touches settings or secrets import `server-only`.
- Dates are ISO strings in data and are shown in Malmö time (`Europe/Stockholm`); labels that render on both server and client are formatted by hand to avoid hydration mismatches.
- Filters and selections that should be shareable live in the URL.
- Free tools only: no paid services or API keys unless clearly worth it.

## Known limits and next steps

- **No protection** on `/admin` or its actions (see the note at the top). Handle this before a public launch.
- **Admin on/off settings don't persist on Vercel** (see Deployment).
- **Events without coordinates** don't appear on the map. Add their venues to `venues.ts`, or geocode them with a free service such as OpenStreetMap Nominatim within its usage policy.
- **Page size.** The home page renders every upcoming event card (several hundred) and `/map` and `/calendar` send all events to the browser; paging would make them lighter.
- **OSM tiles** are fine for a low-traffic site that shows the attribution, per the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Move to a hosted tile plan if traffic grows.
- **Scrapers depend on venue sites' markup.** If a venue changes its site, its source shows as failing in `/admin`, and the other sources keep working.
- **More of the redesign is pending.** The new look (#12) is merged and described here. Two stacked pull requests are still open: #13 (one shared, URL-backed filter bar for Discover, Map and Calendar) and #14 (Tonight, Venues and Saved tabs). This README describes `main` as it is now; update it when those merge.
