# MÖEVENTS

[![Vercel build](https://img.shields.io/github/deployments/herrandyjohansson/Malevents/Production?label=vercel%20build&logo=vercel&logoColor=white)](https://vercel.com/herrandyjohanssons-projects/malevents/deployments)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fmoevents.vercel.app&label=moevents.vercel.app)](https://moevents.vercel.app)
[![Next.js](https://img.shields.io/github/package-json/dependency-version/herrandyjohansson/Malevents/next?logo=nextdotjs&label=Next.js)](https://nextjs.org)
[![React](https://img.shields.io/github/package-json/dependency-version/herrandyjohansson/Malevents/react?logo=react&label=React)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](tsconfig.json)
[![Last commit](https://img.shields.io/github/last-commit/herrandyjohansson/Malevents/main)](https://github.com/herrandyjohansson/Malevents/commits/main)

**What's on in Malmö, in one place.** Malmö's concerts, theatre, films, club nights, exhibitions and family events are spread over dozens of venue sites and ticket listings, each with its own layout. MÖEVENTS reads them, cleans them into one shape and shows them together across five tabs: tonight's timeline, a day-by-day list (or month calendar) with time and area filters, a map, venues and your saved events, with a page for every event. Tickets are bought from the venue or ticket site the event links to.

- **Live site:** <https://moevents.vercel.app>
- **Code:** <https://github.com/herrandyjohansson/Malevents>
- **Needs:** Node.js 20.9 or newer and npm. No database, no accounts, no API keys.

```bash
git clone https://github.com/herrandyjohansson/Malevents.git
cd Malevents
npm install
npm run dev        # http://localhost:3000
```

The first half of this README covers what the site does and how to install, configure, run and test it, and what it depends on outside the repo. The second half is the project's report on how it works: how the code is laid out, which libraries it uses, how data flows from the venue sites to the page, and how work on it is done.

> **The admin is read-only.** There is no login anywhere. The Admin tab is hidden behind an "Admin mode" button, and `/admin` can be opened by anyone who knows the URL, but it only shows: nothing on the site can switch sources, clear caches or change settings. Those changes are made in Vercel, where only the project's members can make them (see [Deployment](#deployment-on-vercel)).

## Contents

**Getting started**

1. [At a glance](#at-a-glance)
2. [What the site does](#what-the-site-does)
3. [Filters](#filters)
4. [Requirements and external dependencies](#requirements-and-external-dependencies)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Running it locally](#running-it-locally)
8. [Tests and checks](#tests-and-checks)
9. [Deployment on Vercel](#deployment-on-vercel)

**How it works**

10. [Tech stack](#tech-stack)
11. [Project structure](#project-structure)
12. [How event data flows](#how-event-data-flows)
13. [Event sources](#event-sources)
14. [Pages and components](#pages-and-components)
15. [Styling and UI components](#styling-and-ui-components)
16. [Logs](#logs)
17. [Development workflow](#development-workflow)
18. [Known limits and next steps](#known-limits-and-next-steps)

## At a glance

| | |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Cache Components, Turbopack), React 19.3, TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui components (new-york style, Radix primitives), lucide icons, dark theme only |
| Tabs | Tonight, Discover (list or month calendar), Map, Venues, Saved, plus Admin when Admin mode is on; every event has its own page |
| Map | Leaflet with clustered pins over OpenFreeMap's keyless "Fiord" vector basemap (drawn with MapLibre); OpenStreetMap raster tiles, darkened with CSS, as the fallback |
| Data | 18 source adapters (16 live: the city calendar, venue sites and ticket listings; 2 demo fixtures), scraped or read from JSON, normalized into one `MalmoEvent` type |
| Caching | `"use cache: remote"` per source (Vercel Runtime Cache), served stale while refreshing in the background |
| Hosting | Vercel, deployed from GitHub (production from `main`, a preview per pull request) |
| Auth | None (see the note above) |
| API keys | None needed |
| Tests | Vitest unit tests that run offline; tests against the live venue sites are opt-in |

## What the site does

- **Intro** (first visit in a browser session, any page): "MÖEVENTS" decrypts letter by letter over the site's aurora (inspired by React Bits' Decrypted Text, rewritten without dependencies in `components/layout/intro.tsx`), while the names of the venues being read decrypt beneath it and the events load behind it; it lifts like a curtain. It lasts exactly as long as the first events take to appear: when the page's skeletons are gone, the letters still scrambling snap into place and the curtain lifts onto the events (about 1.4 s in all on a warm cache, about 4.3 s on a cold one; at most 10 s); a CSS fail-safe removes it even without JavaScript, and reduced-motion visitors get a plain fade.
- **Tonight** (`/tonight`, the first tab): what's on right now, then the rest of the day by part of day (This afternoon, This evening, Late) on an hour-by-hour timeline, or tomorrow once tonight is over. Called "Today in Malmö" before 15:00. Exhibitions fold into an "Open all day" section. Swipe or mouse-drag the date strip horizontally to browse days; click a date to load its events. Below the strip, MiniSearch searches all upcoming events and venues (not just the selected date), with prefix, typo-tolerant and accent-insensitive matching. Share `/tonight?q=jazz` or `/tonight?day=2026-10-29&q=malmo`; changing dates keeps the query, and clearing it restores the day's timeline. Event results show artwork, category, date, venue and price when known. Venue results preview their next two upcoming events with direct event links and link to `/venues/[slug]`, with only that venue's upcoming events and its map. Search scope is explained in the input placeholder rather than a separate helper line. Search runs locally over compact public records, without sending typed queries to a search service.
- **Discover** (`/`): a short title, the shared filter bar (see [Filters](#filters)) and events grouped under day headings, 24 at a time with "Show more". Image cards on wider screens, compact rows on phones. A List ↔ Calendar switch (from tablet width) shows the same filtered events as a month calendar (`?view=calendar`). A small map of the coming week and the listing sites sit at the foot of the page.
- **Event page** (`/events/<id>`): image, kind of event, when, where (venue, area, address), price, a button that names where it leads ("Tickets on Tickster"), Directions, Save, Add to calendar, Share, the description when the listing has a real one, and more at the same venue. From a list it opens as a sheet over the list; a shared link opens the full page. Cancelled and sold-out events say so.
- **Map** (`/map`): the same filters, starting on the next 7 days, plus a month calendar you drag across to pick dates, and pins colored by category. On phones the map fills the screen, with filter chips floating on top (the rest in a bottom sheet) and a swipe-up sheet listing the events.
- **Venues** (`/venues`): every venue with upcoming events, searchable and filterable by area and kind of event; `/venues/<slug>` shows a venue's area, programme and location.
- The old `/week` and `/calendar` addresses redirect into Discover (`?when=week`, `?view=calendar`), keeping any filters.
- **Saved** (`/saved`): events you hearted on any card, grouped by day, with "add to calendar" (.ics) for one event or all. Kept in the browser's localStorage, no account.
- **Admin** (`/admin`): shown in the tabs when "Admin mode" is switched on in the header. Read-only. Per source: health, error and warnings, event count, last fetch, response time, cache lifetime and whether visitors see it; and `/admin/sources/[id]` drills into a source's normalized events and flags events without a map location. Backend problems (a site that is down, slow or returns partial data) are shown here and in `/admin/logs`, never to visitors.

## Filters

Discover (list and calendar) and Map share one filter bar. When and where are up front; the rest is one tap away:

- **When**: a segmented control (Any time, Tonight, Today, This weekend, Next 7 days, Pick dates; Next 30 days in the panel). "Pick dates" folds a drag-to-select calendar open in the bar. The Map starts on the next 7 days.
- **Area**: chips for Centrum, Möllan, Västra Hamnen, Davidshall & Triangeln, Värnhem, Limhamn and Hyllie, with live counts; empty areas are hidden. Areas come from venue coordinates (`lib/events/areas.ts`). Events in Rosengård are left out of the site.
- **Filters panel**: kind of event, free only, hide exhibitions, and listing sites, each with live counts. Active ones show under the bar as chips you can remove, and so does a search on phones (where the search box is in the panel).
- Categories: Music, Stage (theatre, musicals, opera, dance, comedy), Nightlife, Art & exhibitions, Film, Family, Sports, Food & drink, Talks & workshops, Other.

Filters live in the URL (`q`, `cat`, `src`, `when` or `from`/`to`, `free`, `nolong`), so links are shareable and the Discover, Map and Calendar tabs carry them over. Discover filters on the server; Map and Calendar filter in the browser with the same functions from `src/lib/events/filters.ts`. Older `?category=`, `?source=` and map `?from=&to=` links still work. On the phone map the bar becomes a row of floating chips with the rest in a bottom sheet.

## Requirements and external dependencies

### What you need to install

| Requirement | Why |
| --- | --- |
| Node.js 20.9 or newer (developed on Node 22) | Next.js 16 requires at least 20.9 |
| npm (comes with Node.js) | Installs the packages in `package.json`; `package-lock.json` pins their versions |
| Git | Cloning the repository |
| Internet access for `npm install` and `npm run build` | Packages come from the npm registry, and `next/font` downloads the Geist fonts during the build |

Nothing else is needed: no database, no Docker, no API keys and no accounts. The npm packages and what each is for are listed under [Tech stack](#tech-stack).

Optional, for maintainers only:

- The [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`), to refresh the production cache by hand (`vercel cache invalidate --tag events`).
- The [OpenWeb CLI](https://github.com/openweb-org/openweb) (`npm install -g @openweb-org/openweb`), for the OpenWeb benchmark and the `find-malmo-event-source` skill. The offline tests skip the OpenWeb checks when it isn't installed.

### Outside services the site uses

All of them are free and need no key or sign-up.

| Service | What for | Who contacts it, and when |
| --- | --- | --- |
| The 16 venue sites and ticket listings in [Event sources](#event-sources) (Malmö stad, Tickster, Malmö Live, Slagthuset, …) | The events themselves | The server, when a source's cache entry is missing or stale. A source that fails is left out of the lists and shown as failing in `/admin`. `EVENTS_LIVE=false` uses bundled fixtures instead. |
| [OpenFreeMap](https://openfreemap.org) (`tiles.openfreemap.org`) | The map's dark "Fiord" vector basemap, drawn with MapLibre | The visitor's browser, on every map |
| OpenStreetMap's tile server (`tile.openstreetmap.org`) | Fallback raster basemap | The visitor's browser, only when WebGL or OpenFreeMap is unavailable |
| Google Fonts | The Geist and Geist Mono fonts | Only `npm run build` and `npm run dev`: `next/font` downloads them and serves them from the site, so visitors' browsers never contact Google |
| Google Maps | The event page's Directions button | Only when a visitor taps it (a plain link, not an API) |
| [Vercel](https://vercel.com) | Hosting, and the Runtime Cache behind `"use cache: remote"` | Production only. Locally the cache is kept in the Next.js process's memory. |

Upstream requests go through `src/lib/events/http.ts`, which sends a `MaleventsBot` user agent, applies a timeout to every request and only fetches public http(s) URLs.

## Installation

```bash
git clone https://github.com/herrandyjohansson/Malevents.git
cd Malevents
npm install
```

That is all. No environment file or setup step is needed. `npm run dev` and `npm run build` first copy MapLibre's web worker from `node_modules` into `public/vendor/` (`scripts/copy-maplibre-worker.mjs`, git-ignored), so the map works without any manual step.

To check the install, run `npm test`. It runs the offline test suite in a few seconds without touching the network.

## Configuration

The site runs without any configuration: with no environment variables set, it reads the live venue sites and logs at `info`. To change that, set environment variables in your shell, in a `.env.local` file in the project root (Next.js loads it, and `.env*` files are git-ignored), or in Vercel under Settings → Environment Variables.

```bash
# .env.local (example)
EVENTS_LIVE=false                          # bundled fixtures instead of the venue sites
EVENTS_DISABLED_SOURCES=malmo-stad,hypnos  # hide these sources from visitors
LOG_LEVEL=debug                            # one log line per upstream request
```

| Setting | Where | Effect |
| --- | --- | --- |
| `EVENTS_LIVE=false` | env var | Every adapter serves its fixtures instead of calling the live site (for offline work or sandboxes that can't reach the venue sites). Unset means live. |
| `EVENTS_DISABLED_SOURCES` | env var | Comma-separated source ids hidden from visitors, e.g. `malmo-stad,hypnos`. Ids are shown in `/admin`. Read when the server starts: restart `npm run dev` locally, or redeploy in Vercel. Unknown ids are ignored and flagged in `/admin`. |
| `LOG_LEVEL` | env var | Lowest server log level written: `debug`, `info` (default), `warn` or `error`. `debug` adds a line per upstream request. See [Logs](#logs). |
| `DEMO_SOURCE_FAILURE=true` | env var | Makes the Skåne culture demo source fail, to see how the page degrades. |
| `cacheComponents: true` | `next.config.ts` | Turns on `"use cache"`, `cacheLife`, `cacheTag` and partial prerendering. |
| `partialPrefetching: true` | `next.config.ts` | Prefetches only the static part of linked pages. |
| `experimental.staleTimes.dynamic: 30` | `next.config.ts` | Keeps visited pages in the browser's router cache for 30 s, so switching tabs doesn't re-request them. |
| `cacheProfile`, `timeoutMs` | each adapter's `EventSource` in `src/lib/events/sources/` | How long a source's data is cached (`minutes`, `hours` or `days`, see [How event data flows](#how-event-data-flows)) and how long the aggregator waits for it (8 s by default, 15–45 s for the slower sites). |
| `TIME_ZONE` | `src/lib/events/config.ts` | `Europe/Stockholm`: dates are stored as ISO strings and shown in Malmö time. |

Test-only switches (`BENCH_LIVE`, `BENCH`, `BENCH_ROUNDS`, `DUPLICATE_AUDIT_*`) are set by the npm scripts below or described in [benchmarks/openweb/README.md](benchmarks/openweb/README.md) and [the duplicate audit](docs/duplicate-audit-2026-10-24.md).

Nothing in this section can be changed from the site.

## Running it locally

```bash
npm run dev                     # http://localhost:3000, live data
EVENTS_LIVE=false npm run dev   # bundled fixtures only, no network needed
```

To run the production build, the same way Vercel serves it:

```bash
npm run build
npm run start                   # http://localhost:3000
```

The first request with live data is slow, because every venue site is scraped (up to about 20 s on a cold cache). Lists render with the sources that answer within 3 s and fill in on their own; after that the cache answers. Locally the cache lives in the server process's memory, so a restart starts cold again.

To see how the sources are doing, switch on "Admin mode" in the header (or open `/admin`), and `/admin/logs` for the server logs.

## Tests and checks

```bash
npm test                 # Vitest, offline tests only (src/**/*.test.ts, benchmarks/**/*.test.ts)
npm run test:live        # also calls the real venue sites
npm run bench:openweb    # OpenWeb vs current adapters, see benchmarks/openweb/README.md
npm run lint             # ESLint
npx next typegen         # route types: on a fresh clone and after adding routes
npx tsc --noEmit         # type check
npm run build            # the production build Vercel runs
```

Vercel is the project's CI: it builds every pull request and every push to `main`, and the Vercel build badge at the top of this README shows the latest production deployment and links to the deployment list. The build doesn't run lint, the type check or the tests, so run them before pushing. Use `EVENTS_LIVE=false` where the venue sites can't be reached.

## Deployment on Vercel

The site runs on Vercel, connected to this GitHub repository through Vercel's Git integration. Vercel detects Next.js and uses its defaults (`npm install`, `next build`); `vercel.json` only sets an `ignoreCommand` so commits that change nothing but docs skip the deploy.

- **Production** is built and deployed automatically on every push to `main`, which in practice means every merged pull request.
- **Preview deployments** are built for every pull request branch. The Vercel check on the pull request is the project's CI: a failed build shows up there. Previews sit behind Vercel's login (Deployment Protection), so only signed-in team members can open them.
- **Rendering on Vercel.** Static shells are prerendered at build time and served from the CDN. Request-time parts run as serverless Vercel Functions.
- **Runtime Cache.** `fetchSource` uses `"use cache: remote"`, which on Vercel is stored in Vercel's Runtime Cache, shared by all function instances and provided automatically (no setup or keys). Plain in-memory `"use cache"` would be per instance, so every cold instance would re-scrape every venue site. Entries are keyed per build, so the first visits after a new deployment do a cold fetch (up to the source timeouts), and later visits are served from cache while refreshing in the background.
- **Refreshing data.** Data refreshes on its own per the cache profiles, and a new deployment starts with a fresh cache. To force it without a deploy, run `vercel cache invalidate --tag events` (every source) or `--tag events:<id>` (one source) with the Vercel CLI. The site has no refresh button, so visitors can't make it re-scrape the venue sites.
- **Environment variables.** None are needed in production. Set them under the project's Settings → Environment Variables and redeploy (Deployments → ⋯ → Redeploy), since a change only reaches new deployments. `EVENTS_DISABLED_SOURCES` hides sources from visitors; `EVENTS_LIVE=false` makes a deployment use demo data.
- **Switching a source off.** Add its id (shown in `/admin/sources/<id>`) to `EVENTS_DISABLED_SOURCES` and redeploy. `/admin` shows the current value and marks the source "Off in Vercel".
- **Rolling back.** Promote an earlier deployment in the Vercel dashboard (Deployments → ⋯ → Promote / Instant Rollback), or revert the merge on `main`.

## Tech stack

| Package | Used for |
| --- | --- |
| `next` 16.4 | App Router, Server Components, `"use cache"` / Cache Components, `after()`, `next/font` (Geist) |
| `react`, `react-dom` 19.3 | UI; `useSyncExternalStore` for saved events and the admin-mode toggle |
| `tailwindcss` v4 + `@tailwindcss/turbopack` | Styling; CSS is compiled through a Turbopack loader rule in `next.config.ts` |
| `tw-animate-css` | Animation utilities used by the shadcn/ui components |
| `radix-ui` | Accessible primitives behind the dialog, sheet, select and switch components |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Component variants and the `cn()` helper in `src/lib/utils.ts` |
| `lucide-react` | Icons |
| `leaflet` (+ `@types/leaflet`), `leaflet.markercluster` | The interactive maps, with pins grouped into clusters when zoomed out |
| `maplibre-gl`, `@maplibre/maplibre-gl-leaflet` | Draws the OpenFreeMap vector basemap under Leaflet's pins (WebGL) |
| `minisearch` | Tonight's search over upcoming events and venues: prefix, typo-tolerant and accent-insensitive |
| `cheerio` | Parsing HTML from venue sites that have no JSON API |
| `server-only` | Keeps adapters, caching and settings code out of client bundles |
| `typescript` 5 | Type checking (`npx tsc --noEmit`) |
| `eslint` 9 + `eslint-config-next` | Linting (`npm run lint`) |
| `vitest` 3 | Unit tests (`npm test`) |

There is no database. Vercel's build is the automated check on every pull request, and the tests run locally (see [Tests and checks](#tests-and-checks)).

## Project structure

```
.
├── AGENTS.md, CLAUDE.md      Notes for coding agents (read the Next.js docs in node_modules/next/dist/docs/)
├── PRODUCT.md                who the site is for and its product principles
├── components.json           shadcn/ui config (new-york, neutral, CSS variables, lucide)
├── next.config.ts            cacheComponents, partialPrefetching, staleTimes, Tailwind loader, /week and /calendar redirects
├── eslint.config.mjs
├── tsconfig.json             "@/*" → src/*
├── vitest.config.ts          runs src/**/*.test.ts and benchmarks/**/*.test.ts
├── scripts/                  copy-maplibre-worker.mjs (runs before dev and build)
├── benchmarks/openweb/       test-only OpenWeb vs adapter benchmark
├── docs/                     security (OWASP), duplicate audit, source candidates, agent skills
├── .claude/                  agent skills and rules used in this project (see docs/skills.md)
├── public/                   static assets
└── src/
    ├── app/                  routes (App Router)
    │   ├── layout.tsx        html shell, Geist fonts, dark color scheme, aurora Backdrop, SiteHeader
    │   ├── globals.css       Tailwind v4 theme tokens, dark palette, map tile darkening, effects
    │   ├── page.tsx          /            Discover
    │   ├── map/page.tsx      /map         Map
    │   ├── tonight/page.tsx  /tonight     Tonight
    │   ├── days/[day]/page.tsx  /days/:day  one date by area (from the calendar)
    │   ├── events/[id]/page.tsx /events/:id  one event (full page)
    │   ├── @sheet/           the same event as a sheet over a list (intercepting route)
    │   ├── venues/
    │   │   ├── page.tsx                  /venues              venue directory
    │   │   └── [slug]/page.tsx           /venues/:slug        one venue's programme and map
    │   ├── saved/page.tsx    /saved       Saved
    │   ├── admin/
    │   │   ├── page.tsx                  /admin               source overview
    │   │   ├── sources/[id]/page.tsx     /admin/sources/:id   one source's events
    │   │   └── logs/                     /admin/logs          log dashboard (+ JSONL download)
    │   └── error.tsx         error boundary
    ├── components/
    │   ├── layout/           site-header (+ aurora Backdrop), logo, page-header, nav-config (tab list), nav-tabs (desktop pill tabs, phone tab bar, Admin mode toggle)
    │   ├── events/           event-card, event-art (image over a category-colored placeholder), remote-image (hides itself if a venue's image fails), event-results, spotlight-list, skeletons, source-status
    │   ├── map/              leaflet-map, basemap (OpenFreeMap with OSM fallback), event-map-view, range-calendar, week-map preview/card, legend
    │   ├── filters/          the shared filter bar: inline buttons (filter-bar), phone-map filter sheet (filter-panel), search box, useFilters (URL state)
    │   ├── calendar/         calendar-view
    │   ├── tonight/          timeline-event
    │   ├── venues/           venue-grid (searchable directory), venue-map
    │   ├── saved/            save-button (the heart on cards), saved-list
    │   ├── admin/            admin-nav, status-badge, logs/
    │   └── ui/               shadcn/ui: alert, badge, button, card, dialog, input, segmented-control, select, sheet, skeleton, switch, table
    └── lib/
        ├── utils.ts          cn()
        ├── log.ts            structured JSON server logs (LOG_LEVEL) and the in-memory buffer behind /admin/logs
        ├── log-analysis.ts   the numbers on /admin/logs
        ├── admin-mode.ts     per-browser Admin mode flag (localStorage)
        ├── days.ts           YYYY-MM-DD day helpers and month grids (map, calendar, filters)
        ├── saved.ts          hearted events in localStorage (useSyncExternalStore)
        ├── saved-snapshot.ts the saved-event snapshot, so Saved works after an event leaves the feeds
        ├── ics.ts            iCalendar (.ics) export for "add to calendar"
        └── events/
            ├── types.ts          MalmoEvent, EventSource, SourceStatus, categories
            ├── config.ts         EVENTS_LIVE, EVENTS_DISABLED_SOURCES, time zone (Europe/Stockholm), default timeout
            ├── sources/          one adapter per upstream; index.ts is the registry
            ├── fetch-source.ts   the one cached entry point per source
            ├── aggregate.ts      fan-out, timeouts, failure isolation, de-duplication
            ├── dedupe.ts         merges listings of one occurrence from several sources
            ├── normalize.ts      category from keywords or the venue, cancelled flag
            ├── areas.ts          venue coordinates → Malmö areas; the Rosengård exclusion
            ├── filters.ts        the shared filter model: URL params ↔ filters, matcher, facet counts; Malmö-local days
            ├── search.ts         MiniSearch index for Tonight's search
            ├── map-data.ts       events → map pins (week preview and date ranges)
            ├── calendar-data.ts  events → calendar entries
            ├── venue-data.ts     events grouped into venues with slugs, counts and categories
            ├── venues.ts         coordinates for known Malmö venues
            ├── http.ts           fetch (GET, or POST JSON) with timeout, MaleventsBot user agent, SourceError
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
                       • skips sources listed in EVENTS_DISABLED_SOURCES
                       • runs every enabled source in parallel, each with its own timeout
                       • "fast" mode: renders after 3 s with the sources that have answered;
                         the rest keep fetching in the background and the page refreshes itself
                       • failures become a status, never a crash
                       • merges and de-duplicates
                                                     │
              ┌──────────────────────┬───────────────┴──────────┬───────────────────┐
              ▼                      ▼                          ▼                   ▼
        / (filters on server, list or calendar)   /map (map-data.ts)   /events/[id] (event-detail)   /admin (statuses)
```

1. **Adapters.** Each file in `src/lib/events/sources/` knows one upstream. Its `fetchEvents()` fetches JSON or HTML and maps it into `MalmoEvent` (id `<source>:<upstream id>`, title, start and end as ISO strings, category, venue, price, `isFree`, image, URL, ticket URL, sold out, notes). The rest of the app only sees that shape.
2. **Caching.** `fetch-source.ts` is the cached entry point for each source (`fetch-page.ts` additionally caches event detail pages, refreshed weekly, also in the remote cache). Each source has its own entry and the tags `events` and `events:<id>`. Lifetimes come from the source's `cacheProfile`:

   | Profile | Refreshes in the background every | Stale copy may be served for |
   | --- | --- | --- |
   | `minutes` | 1 minute | 1 day |
   | `hours` (default) | 6 hours | 7 days |
   | `days` | 1 day | 30 days |

   The long expiry means visitors get the cached copy immediately while a slow scrape runs behind the scenes. A failure is cached for seconds only, and is returned rather than thrown so the real error message reaches the admin in production.
3. **Aggregation.** `getAllEvents()` runs all enabled sources with a per-source timeout (8 s by default; 15–45 s for the slower sites), records a status per source, and merges events. Venue names are first made canonical (`withCanonicalVenue` in `venues.ts`: Slagthusets Teater → Slagthuset with the room kept in the address, Malmö Live → Malmö Live Konserthus, …; old venue pages redirect). `mergeDuplicates` (`dedupe.ts`) then merges listings of one occurrence: the same normalized title and start minute, or a shared Tickster booking id or event page from different sources starting within 15 minutes; never venues more than 500 m apart, never two start times from one source, and never a group spanning more than 15 minutes, so matinees, repeat screenings and sessions stay separate. A venue's own source wins over aggregators (sources with `aggregator: true`: Malmö stad, Tickster · Malmö); the others fill its gaps (description, image, ticket link, price, coordinates) but not its sold-out or cancelled status. Merged ids are kept in `duplicateIds`, so old event links and saved hearts still resolve. It is wrapped in React's `cache()` so the home page's map and list share one lookup. See [the duplicate audit](docs/duplicate-audit-2026-10-24.md).

   On a cold cache the scraped sites take up to about 20 s. So the lists, map, Tonight and venue pages call it in **"fast" mode**: a source that hasn't answered within 3 s comes back as `pending` and the page renders with the rest (about 450 events after 4 s on a cold start). The pending fetch carries on in the background, kept alive past the response with `after()`, and fills the cache. A neutral "Loading more events…" line (`PendingSources`, which never names the slow site) refreshes the page every few seconds, one refresh at a time, until nothing is pending (all ~1,280 events after about 10 s), keeping scroll, filters and any open sheet. A refresh joins a fetch already in progress in the same server process instead of scraping the site again. The event page and the admin use **"complete" mode** and wait for every source, so a link to an event from a slow source never reads as "not found".
4. **Locations.** Adapters pass through coordinates when the upstream has them; otherwise `venues.ts` looks up the venue name in a list of known Malmö venues. Events still without coordinates are left off the map and flagged in the admin.
5. **Rendering.** Pages keep a static shell (header, intro) that is prerendered, and stream the data-dependent part behind a skeleton inside `<Suspense>`. Data parts call `connection()` because they depend on the current time.
6. **Admin.** Read-only, with no Server Actions. A source is switched off with the `EVENTS_DISABLED_SOURCES` environment variable (`config.ts`, read by `isSourceEnabled` in `sources/index.ts`); cached data is refreshed with `vercel cache invalidate --tag events` (or `events:<id>`). Both are done in Vercel (see [Deployment](#deployment-on-vercel)). Visitors never see a source's state: a failing or slow source is simply missing from the list until it is back, and the admin shows why.

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
| Malmö stad (city event calendar) | JSON embedded in HTML | hours | on |
| Malmö Konsthall | The Events Calendar REST API | hours | on |
| Skånes Dansteater | HTML | hours | on |
| Plan B | Next.js page data | hours | on |
| Biograf Spegeln | Next.js page data | hours | on |
| Panora | bio.se booking API (JSON, POST) | hours | on |
| Medley | The Events Calendar REST API | hours | on |
| Malmö Arena | HTML | hours | on |
| Hypnos Theatre | HTML (calendar links) | hours | on |
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
| Malmö stad | The city's event calendar embeds its listing as JSON in the page; one request with `startDate`, `endDate` and `num` reads the next 90 days (about 290 events: libraries, museums, Folkets Park, Kulturskolan, outside organisers). Its categories and the "Barn och familj" target group map onto ours. | `https://malmo.se/evenemang?startDate=…&endDate=…&num=1000` |
| Malmö Konsthall | The Events Calendar plugin's JSON API, paged. `sources/events-calendar.ts` turns any WordPress site running that plugin into a source. | `https://malmokonsthall.se/wp-json/tribe/events/v1/events` |
| Skånes Dansteater | Server-rendered calendar, one `<article class="performance">` per performance with a `<time datetime>`; performances outside Malmö are skipped. Production pages add image and text. | `https://www.skanesdansteater.se/kalender` |
| Plan B | The home page's `__NEXT_DATA__` carries the venue's featured events (day only, no start time); the full programme loads in the browser, so only featured events are listed. Events the site promotes at other venues are skipped. | `https://www.planbmalmo.com/` |
| Inkonst | Its public Tickster organizer page (the event date is in each link), plus each Tickster event page for start time, price and image. `sources/tickster.ts` turns any Tickster organizer page into a source. | `https://www.tickster.com/se/sv/events/by/bkz8z545crn3x5m/inkonst` |
| Biograf Spegeln | The home page's `__NEXT_DATA__` carries the whole programme (about 160 films, 270 screenings): one event per screening with screen, Tickster link and sold-out flag. The CMS writes image URLs with `http://localhost:8080`; the adapter serves the same path from the site. | `https://biografspegeln.se` |
| Panora | The bio.se booking API that Panora's programme links to, found with an OpenWeb capture; it only answers POST (`{"cinemaId":2128}`). One event per screening, children's films as Family. Talks on panora.se are not in it. | `https://bio.se/api/cinemas/films` |
| Medley | The Events Calendar API through `events-calendar.ts`. Its WordPress time zone is "UTC+0" although the times are Malmö times, so `localTimes` reads `start_date` as local; private bookings ("abonnerat") are skipped. | `https://medleymalmo.se/wp-json/tribe/events/v1/events` |
| Malmö Arena | Server-rendered HubSpot listing, one `.event-listing__item` per event with day and time but no year (inferred). Redhawks home games are Sports. | `https://www.malmoarena.com/evenemang` |
| Hypnos Theatre | The home page's `.screening-row`s; exact UTC start and end come from each row's "add to Google Calendar" link. | `https://hypnostheatre.com` |

HTML is parsed with [cheerio](https://cheerio.js.org/). `scrape.ts` finds event "cards" by their links rather than by theme class names, and parses Swedish dates ("fre 9 okt 19.00", "26 november 2026 | 18:30"), inferring the year when a listing leaves it out. Detail pages go through `fetchDetailPage`, which caches each page for a week, so a listing refresh only fetches pages for events it hasn't seen; at most 3–4 are fetched at once.

### Live and demo data

Sources with a live endpoint fetch it by default. Sources that only have demo fixtures start switched off in live mode, so made-up events never mix with real ones. With `EVENTS_LIVE=false`, every source serves bundled fixtures in its upstream's real shape (marked "demo" in the UI), with dates relative to today.

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
| `/tonight` | `app/tonight/page.tsx` | `TimelineEvent`, `SaveButton` | Request-time; anchored on the current Malmö time |
| `/days/[day]` | `app/days/[day]/page.tsx` | `TimelineEvent`, `AllDay` | Request-time; one date grouped by area, reached from the calendar with the shared filters |
| `/events/[id]` | `app/events/[id]/page.tsx`, `app/@sheet/(.)events/[id]/page.tsx` | `EventDetail`, `EventActions`, `EventSheet` | Request-time; the full page on a direct visit, a sheet over the current page when opened from a list |
| `/venues` | `app/venues/page.tsx` | `VenueGrid` | Request-time; search and category filter run in the browser |
| `/venues/[slug]` | `app/venues/[slug]/page.tsx` | `VenueMap`, `EventCard` | Request-time; the venue is looked up from the live events, so unknown slugs 404 |
| `/saved` | `app/saved/page.tsx` | `SavedList` | Static shell; the list is read from localStorage in the browser, with .ics export |
| `/admin` | `app/admin/page.tsx` | `StatusBadge`, shadcn `Table`/`Card`; read-only | Request-time; `robots: noindex` |
| `/admin/sources/[id]` | `app/admin/sources/[id]/page.tsx` | event table for one source | Request-time |
| `/admin/logs` | `app/admin/logs/page.tsx`, `logs/download/route.ts` | log dashboard: load times, cache hit rate, per-source rows, filterable stream | Request-time; reads this instance's in-memory log buffer; the download is a read-only `GET` |

Shared pieces:

- `SiteHeader`, `Logo` and `NavTabs` (`components/layout/`) render the header, the tabs and the Admin mode button; `SiteFooter` (same file as the header) credits the coat of arms in the logo. The tab list lives in `nav-config.ts`. On desktop the tabs are a row with a sliding active pill; on phones the visitor tabs move to a fixed bottom tab bar like a native app, and Admin moves to an icon in the header (rendered outside the header, whose backdrop blur would trap a fixed child; `--tabbar-h` in `globals.css` pads the page above it). Admin mode is a `localStorage` flag read through `useSyncExternalStore` (`lib/admin-mode.ts`); it only shows or hides the tab.
- `LeafletMap` is a client component that loads Leaflet in the browser and draws category-colored pins, clustered with `leaflet.markercluster`. `basemap.ts` adds the map underneath: OpenFreeMap's dark "Fiord" vector style through MapLibre when the browser has WebGL, otherwise the standard OSM raster tiles, which `globals.css` darkens. Either way the attribution is kept.
- `Backdrop` (in the root layout) draws the slowly drifting aurora behind every page, and `PageHeader` gives each tab the same eyebrow, title and description.
- `EventCard` is image-led: `EventArt` shows the event's picture over a category-colored gradient with an emoji, which also covers images that fail to load. Cards have a cursor "spotlight" hover effect and skeletons a shimmer, both hand-written in Tailwind and CSS.

## Styling and UI components

- **Tailwind v4** is configured in CSS, not in a `tailwind.config` file: `src/app/globals.css` imports Tailwind and `tw-animate-css` and declares the theme tokens (colors, radius, fonts) as CSS variables. Turbopack compiles it through the `@tailwindcss/turbopack` loader set in `next.config.ts`.
- **Dark theme only.** `<html>` always has the `dark` class and the viewport declares `colorScheme: "dark"`; there is no light theme or theme switch.
- **shadcn/ui** components are copied into `src/components/ui/` (configured by `components.json`) and edited like any other code. They build on Radix primitives from the `radix-ui` package. Add more with `npx shadcn@latest add <component>`.
- **Fonts**: Geist and Geist Mono through `next/font/google`.
- **Logo and tab icon**: Skåne's coat of arms (landskapsvapen), by Havsjö after Leonid 2 on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sk%C3%A5ne_landskapsvapen.svg), licensed [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The file is `public/brand/skane-landskapsvapen.svg`, with a copy at `src/app/icon.svg` for the favicon; the only change is an added `viewBox` so it scales. The licence requires the credit, which `SiteFooter` shows on every page; keep it, and share changed versions of the image under the same licence. Official insignia can be restricted separately from copyright: the provincial arms are used here for a non-commercial site, and Malmö's registered city arms are deliberately not used (SFS 1970:498 restricts registered municipal arms in business use). There is no `favicon.ico` or `apple-icon`.

## Logs

The server writes one JSON object per line (`src/lib/log.ts`), with `ts`, `level`, `event` and fields for that event. `LOG_LEVEL` sets the lowest level written (default `info`).

| Event | Level | When | Main fields |
| --- | --- | --- | --- |
| `server.started` | info | Server start (`src/instrumentation.ts`) | `liveMode`, `logLevel` |
| `events.loaded` | info | Every request that loads events | `durationMs`, `events`, `duplicates`, `ok`/`failed`/`disabled`, `slowest`, and per source `state`, `count`, `ms`, `cache` (hit/miss), `ageS` |
| `source.fetched` | info | A source fetched from its upstream (a cache miss) | `source`, `durationMs`, `events`, `excluded` (dropped as Rosengård), `unplaced`, `timeUnknown`, `cacheProfile`, `warnings` |
| `source.fetch_failed` | warn | A source's fetch failed | `source`, `reason`, `durationMs`, `error` |
| `source.unavailable` | warn | A request got no events from a source (failure or timeout) | `source`, `durationMs`, `error` |
| `crawl.listing` | info | A paged listing was read | `source`, `pages`, `maxPages`, `items`, `stop` (`last_page`, `empty_page`, `page_failed`, `max_pages`) |
| `crawl.details` | info | Detail pages were read | `source`, `urls`, `attempted`, `failed`, `skipped`, `durationMs` |
| `http.response` | debug | Each upstream request that succeeded | `source`, `url`, `status`, `bytes`, `durationMs` |
| `http.failed` | warn | Each upstream request that failed | `source`, `url`, `status`, `reason` (`timeout`, `network`, `http`, `too_large`, `invalid_json`, `blocked_url`), `error` |
| `request.failed` | error | A server error while rendering or in an action | `path` (without query), `route`, `routeType`, `digest`, `error` |

Logs hold events and numbers, never visitor input: request paths are logged without their query string.

**In the app:** with Admin mode on, `/admin/logs` shows them: page load time (median, 95th percentile and a trend), cache hit rate, upstream requests and failures, a row per source (health, average fetch and request time, data, cache hits, last fetch), and a filterable stream where each line opens to its JSON. Filters (time window, source, lowest level, event, search) live in the URL. "Go live" refreshes every 5 s, and "JSONL" downloads every entry. The page reads an in-memory buffer of the last 2,000 entries at every level, whatever `LOG_LEVEL` says. It is lost on restart, and on Vercel each instance keeps its own, so the Vercel Logs view stays the full history.

Locally, save and query them with `jq`:

```bash
LOG_LEVEL=debug npm run start 2>&1 | grep --line-buffered '^{' | tee logs.jsonl   # JSON lines only, warnings included
jq -c 'select(.event == "events.loaded") | {durationMs, slowest}' logs.jsonl
jq -c 'select(.event == "source.fetched") | {source, durationMs, events, unplaced}' logs.jsonl
jq -r 'select(.event == "http.response") | .source' logs.jsonl | sort | uniq -c   # requests per source
jq -c 'select(.level == "warn" or .level == "error")' logs.jsonl
```

On Vercel the same lines appear under the project's Logs, searchable by text (e.g. `source.fetched`); set `LOG_LEVEL` in the project's environment variables.

## Deployment on Vercel

The site runs on Vercel, connected to this GitHub repository through Vercel's Git integration. Vercel detects Next.js and uses its defaults (`npm install`, `next build`); `vercel.json` only sets an `ignoreCommand` so commits that change nothing but docs skip the deploy.

- **Production** is built and deployed automatically on every push to `main`, which in practice means every merged pull request.
- **Docs-only commits are not deployed.** `vercel.json` has an `ignoreCommand` that skips the build when a commit only changes Markdown files, `docs/`, `review/` or `ASSIGNMENT_*/`. Every deployment starts with an empty Runtime Cache, so each one re-scrapes every venue and rewrites every cache entry.
- **Preview deployments** are built for every pull request branch (except docs-only commits). The Vercel check on the pull request is the project's CI: a failed build shows up there. Previews sit behind Vercel's login (Deployment Protection), so only signed-in team members can open them.
- **Rendering on Vercel.** Static shells are prerendered at build time and served from the CDN. Request-time parts run as serverless Vercel Functions.
- **Runtime Cache.** `fetchSource` uses `"use cache: remote"`, which on Vercel is stored in Vercel's Runtime Cache, shared by all function instances and provided automatically (no setup or keys). Plain in-memory `"use cache"` would be per instance, so every cold instance would re-scrape every venue site. Entries are keyed per build, so the first visits after a new deployment do a cold fetch (up to the source timeouts), and later visits are served from cache while refreshing in the background.

  The Hobby plan includes 200,000 Runtime Cache writes a month. Every cache miss is a write, the cache is per region, and a new deployment starts empty, so lifetimes are kept long: sources refresh every 6 hours, detail pages weekly, and failures are kept for 10 minutes. On 2 November 2026 the team hit 100% of that limit with hourly source refreshes, daily detail-page refreshes, 15-second failure entries and a deploy for every docs commit. Check usage under Usage → Runtime Cache in the Vercel dashboard.
- **Refreshing data.** Data refreshes on its own per the cache profiles. To force it, use "Refresh" in `/admin`, which clears the source's cache tag.
- **Environment variables.** None are needed in production. `EVENTS_LIVE=false` can be set in the Vercel project settings to make a deployment use demo data.
- **Admin settings don't persist on Vercel.** `settings.ts` writes a JSON file, and Vercel Functions have a read-only, per-instance file system, so toggling a source off doesn't stick in production. Swapping `settings.ts` for a key-value store (for example Upstash Redis or Edge Config from the Vercel Marketplace, keeping the same two functions) fixes this.
- **Rolling back.** Promote an earlier deployment in the Vercel dashboard (Deployments → ⋯ → Promote / Instant Rollback), or revert the merge on `main`.

## Development workflow

1. **One pull request per task.** Each change is made on its own branch (`claude/<task>-<id>` for changes made by Claude in the project) and opened as a pull request against `main`.
2. **Check before pushing.** Run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build` locally. Use `EVENTS_LIVE=false` where the venue sites can't be reached.
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

- **Duplicate events and venue aliases.** The [24 October duplicate audit](docs/duplicate-audit-2026-10-24.md) found listings of one show from several sources, a one-hour error in the city calendar's times, and venues split over several names. All three are fixed (identity-based merging, corrected times, reviewed venue aliases); on the same raw data, identity-linked duplicates fell from 44 surplus rows to 3. The remaining ones disagree on time by 30–90 minutes (doors vs show) and are left for review; fuzzy title matches are only reported, never merged.
- **`/admin` is open to read.** It changes nothing (see the note at the top), but anyone with the URL can see source health, upstream URLs, error messages and `/admin/logs`, none of which hold secrets or visitor data. To hide it as well, put a login or Vercel's password protection in front of it. All OWASP exceptions are listed in [docs/security-owasp.md](docs/security-owasp.md).
- **Events without coordinates** don't appear on the map. Add their venues to `venues.ts`, or geocode them with a free service such as OpenStreetMap Nominatim within its usage policy.
- **Page size.** Discover renders 24 events at a time; the Map and the calendar view still send all events to the browser.
- **Map tiles.** OpenFreeMap is free with no key or usage cap, but it is a community service with no uptime promise. The OSM raster fallback is fine for a low-traffic site that shows the attribution, per the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Move to a hosted tile plan if traffic grows.
- **Scrapers depend on venue sites' markup.** If a venue changes its site, its source shows as failing in `/admin`, and the other sources keep working.
- **Saved events live in one browser.** Hearts are kept in localStorage, so they don't follow you to another device and are lost if site data is cleared.
