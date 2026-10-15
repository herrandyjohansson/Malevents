# Codebase Concerns

Scope: application code in `src/`. `.agents/skills/**` is excluded from all findings and metrics. The scanner's TODO/FIXME/HACK hits all came from `.agents/skills/acquire-codebase-knowledge/scripts/scan.py`; the app has none.

Columns: **Type** is *Confirmed* (seen in code), *Risk* (plausible, not demonstrated by running) or *Question* (depends on owner intent). This document describes problems only; it contains no proposed solutions (by request).

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| # | Severity | Type | Concern | Files / functions | Evidence | Impact on readability / maintenance | Consequence | Confidence |
|---|----------|------|---------|-------------------|----------|-------------------------------------|-------------|------------|
| R1 | high | Confirmed | Day/date math exists in several independent copies | `components/calendar/calendar-view.tsx` `toDate`, `toDay`, `addDays`, `addMonths`, `daysBetween`, `monthGrid` (l. 20-49) vs `lib/days.ts` `toDate`, `toDay`, `addDays`, `addMonths`, `monthGrid`, `rangeLength`; Malmö "today" in `filters.ts:216` `localDay`, `demo-dates.ts:27` `malmoToday`, `tickster.ts:144` `malmoTime(0,"00:00").slice(0,10)`; "Friday 9 October" in `days.ts:116` `formatDay` and `format.ts:93` `formatDayLabel` | Side-by-side reading of the listed lines | A reader must check which copy a view uses; behaviour can differ per tab | A fix to week start, DST or labels in one copy does not reach the others | high |
| R2 | high | Confirmed | Adapter plumbing is copy-pasted across scraping adapters | Detail enrichment: `tickster.ts:146-154`, `moriska.ts:165-173`, `malmo-opera.ts:79-86`, `malmo-stadsteater.ts:99-106` (the last two are near-identical, incl. the empty-meta literal written 4 times). Pagination "page 1 required, later pages best effort": `tickster.ts:108-128`, `moriska.ts:127-153`, `malmo-opera.ts:53-69`, `slagthuset.ts:101-112`. `kind: LIVE_MODE ? … : "fixture"` and `demo: !LIVE_MODE` in 6 adapters | Listed lines | Each new adapter repeats ~30 lines of plumbing; differences between copies (e.g. `MAX_DETAILS` only in two of four) are easy to miss | Behaviour fixes (politeness, error handling) must be repeated per adapter | high |
| R3 | high | Confirmed (known) | Admin is unauthenticated; Server Actions are callable by anyone | `app/admin/actions.ts` `setSourceEnabledAction`, `refreshSourceAction`, `refreshAllSourcesAction` | `actions.ts:8` comment; `lib/admin-mode.ts:5-7` | — | Anyone can switch sources off (where the settings file is writable) or purge the cache repeatedly, forcing re-scrapes of every venue site | high (acknowledged in CLAUDE.md) |
| R4 | medium | Confirmed | Data layer depends on UI type files | `lib/events/map-data.ts:3` imports `MapEvent` from `components/map/types`; `lib/events/calendar-data.ts:3` imports `CalendarEvent` from `components/calendar/types` | Import lines | The direction lib → components is the reverse of the rest of the code; `MapEvent`/`CalendarEvent` also redeclare fields already in `Filterable` | Changing a component prop type silently changes the server data contract | high |
| R5 | medium | Confirmed | Client filtering logic duplicated between Map and Calendar | `event-map-view.tsx:54-63` and `calendar-view.tsx:93-112`: `filterKey`, two `useMemo` with `eslint-disable react-hooks/exhaustive-deps` each, `facetCounts`, `countFor`; `lastMonth` also in `event-results.tsx:35-36` and `event-map-view.tsx:58-62` | Listed lines | Same logic, four lint suppressions | Changes to filter behaviour must be made in 2–3 places | high |
| R6 | medium | Risk | Intl formatting in a client component that is also server-rendered | `calendar-view.tsx:51-57` `monthLabel`, `dayLabel` (used at l. 119, 176, 228) | `lib/days.ts:79-80` explains that Intl output differs between ICU versions and breaks hydration | Contradicts the stated convention | Possible hydration mismatch on the calendar heading if server and browser ICU differ | medium |
| R7 | medium | Risk | Day stepping by fixed 24 h across a DST change | `week-data.ts:23` `buildWeek` (`now + i * DAY_MS`), `map-data.ts:47` `weekMapEvents` | On a 25-hour day (DST end, next on 2026-10-25), `now + 24h` between 00:00 and 00:59 local lands on the same date | — | Week tab could show one day twice and drop the seventh; map preview range off by one day | medium (reasoned, not reproduced) |
| R8 | medium | Confirmed | Source timeout does not stop the work | `aggregate.ts:11-26` `withTimeout`; long sequential crawls in `malmo-opera.ts:55` (≤30 pages), `tickster-malmo.ts:21` (≤25 pages + ≤150 detail pages) | No abort signal reaches `fetchSource` | — | A timed-out source keeps fetching in the background; the page shows it as failed while upstream load continues | high |

### 2) Technical Debt

| # | Debt item | Type | Where (files / functions) | Evidence | Impact on readability / maintenance | Consequence | Confidence |
|---|-----------|------|---------------------------|----------|-------------------------------------|-------------|------------|
| D1 | Swedish text patterns repeated as inline regexes | Confirmed | Sold-out: `slagthuset.ts:83,92`, `tickster.ts:83`, `malmo-stadsteater.ts:84`, `malmo-opera.ts:90`. Free: `map.ts:27`, `tickster.ts:80`, `malmo-opera.ts:106`, `malmo-live.ts:75`, `moriska.ts:82,119`, `malmo-stadsteater.ts:82` | grep | Variants differ slightly (`utsål` vs `utsåld`, with/without `free`) | A new wording handled in one adapter is missed in others | high |
| D2 | Month and weekday name arrays copied | Confirmed | `scrape.ts:9`, `tickster.ts:191`, `malmo-opera.ts:129-130`, `moriska.ts:192,219`, `malmo-stadsteater.ts:151-152`; `WEEKDAYS` in `calendar-view.tsx:15` and `range-calendar.tsx` | grep | Noise in fixtures and UI | Low; inconsistency risk only | high |
| D3 | Venue coordinates held in two places | Confirmed / Question | `venues.ts:9-28` table and `VENUE` constants in `malmo-live.ts:41-47`, `slagthuset.ts:51`, `moriska.ts:23`, `malmo-opera.ts:19`, `inkonst.ts:12`; separate `STAGES` in `malmo-stadsteater.ts:18-24` | Same lat/lng repeated | Unclear which list is authoritative; CLAUDE.md says to add coordinates to `venues.ts` | Moving a pin needs edits in two files | high |
| D4 | Second, unused HTTP + JSON-LD path | Confirmed / Question | `jsonld.ts` (`fetchJsonLdEvents`, `extractJsonLdEvents`, `jsonLdToEvent`) is imported by no file; `fetchJsonLdEvents` re-implements `http.ts` `request()` without `USER_AGENT`; `kind: "json-ld"` (`types.ts:65`) is never set | grep for importers | Reader cannot tell if it is live code; README recommends it for new sources | If used later, it bypasses the shared header and error shape | high |
| D5 | Misleading module names | Confirmed | `lib/events/map.ts` = category + price mapping; `lib/events/demo-dates.ts` = production time-zone conversion (`malmoLocalToIso` used by `scrape.ts:56`, `malmo-live.ts:66`, `slagthuset.ts:84`); `filters.ts` also owns `localDay`, `localTime`, `isUpcoming` used by `week-data`, `venue-data`, admin pages | File contents vs names | Hard to find code by name | Contributors may duplicate helpers they cannot find (see R1) | high |
| D6 | Event-classification logic inside a page | Confirmed | `app/tonight/page.tsx:40-61` (live/later/allDay/tomorrow) with its own `DEFAULT_DURATION_MS` (l. 20) instead of `filters.ts` `isUpcoming` | Listed lines | Page mixes data rules and layout | Rule changes to "upcoming" do not reach Tonight | high |
| D7 | Inconsistent defaults and cut-offs | Confirmed / Question | Default duration 3 h (`filters.ts:225`, `tonight/page.tsx:20`) vs 2 h (`ics.ts:11`); past-event cut-off `-6 h` (`malmo-live.ts:95`, `slagthuset.ts:121`), `ymd >= today` (`tickster.ts:145`), none in Moriska/Opera/Stadsteater; sold-out also prefixed into `description` only in `malmo-live.ts:65` and `slagthuset.ts:83` | Listed lines | Same concept, different values | An event's end differs between the app and the exported calendar file | high |
| D8 | Keyword category mapping by substring, patched per adapter | Confirmed | `map.ts:15-22` `toCategory` (`"art"` matches "party", "Mozart"; `"bio"`, `"pop"`, `"dj"` also substrings); overrides in `malmo-opera.ts:98-104` and `malmo-stadsteater.ts:118-119` | Comment at `malmo-opera.ts:99` | Category rules live in three places | More per-adapter overrides accumulate | high |
| D9 | "When" filter labels defined three times with different text | Confirmed | `filters.ts:13-20` `WHEN_OPTIONS`, `filter-bar.tsx:41-46` `QUICK_WHEN`, `filter-bar.tsx:143-150` `WHEN_SEGMENTS` ("This weekend" vs "Weekend", "Next 7 days" vs "7 days"); `filter-panel.tsx:237` `formatRangeShort` beside `days.ts` `formatRange` | Listed lines | — | Renaming an option needs three edits | high |
| D10 | Repeated small view helpers | Confirmed | `new Map(sources.map(s => [s.id, s.name]))` in 5 places (`map-data.ts:45,55`, `calendar-data.ts:15`, `event-results.tsx:34`, `venues/[slug]/page.tsx:47`); `sources.filter(s => s.enabled).map(...)` in 3 pages; `toMapEvent` vs calendar mapping share 8 fields; category counting in `week-data.ts:40-42` and `venue-data.ts:51-63`; enablement rule `settings[id]?.enabled ?? isEnabledByDefault(source)` in `aggregate.ts:77` and `admin/sources/[id]/page.tsx` | grep | — | Low individually; adds up | high |
| D11 | `demo` flag has two meanings | Confirmed | Fixture-only sources `demo: true` always; live-capable sources `demo: !LIVE_MODE` | `malmo-stad.ts:53` vs `malmo-live.ts:109` | Reader must know both cases to read `isEnabledByDefault` | — | high |
| D12 | Legacy URL param still produced internally | Confirmed | `components/events/source-status.tsx:29` links to `/?source=`; `filters.ts:70` documents `source` as the param "older links used" | Listed lines | — | Legacy parsing cannot be removed without breaking an internal link | high |
| D13 | Unused export | Confirmed | `format.ts:93` `formatDayLabel` has no callers | grep | — | — | high |
| D14 | Parsing code without tests | Confirmed | Exported parsers in every scraping adapter, `scrape.ts`, `demo-dates.ts` | `TESTING.md` | Changes to date or card parsing can only be checked by running against live sites or fixtures | Regressions found by users | high |

### 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap | Type / confidence |
|------|----------------|----------|--------------------|-----|-------------------|
| Unprotected admin actions and pages | A01 Broken Access Control | `app/admin/actions.ts`, `app/admin/page.tsx` (`robots: { index: false }`) | Not indexed; tab hidden unless admin mode is on (UI only) | No access check | Confirmed, high |
| Cache purge as a load amplifier | A04 Insecure Design | `refreshAllSourcesAction` → `updateTag("events")` | Failures cached for seconds | Unlimited calls trigger full re-scrapes of all upstreams | Risk, medium |
| Upstream URL placed in DOM `href` outside React | A03 Injection | `components/map/leaflet-map.tsx:89` `item.href = e.url` | Text fields use `textContent` (`leaflet-map.tsx:75, 221`); React sanitizes JSX hrefs elsewhere | No scheme check on scraped URLs on this path | Risk, low |
| Settings file write on request | A05 Security Misconfiguration | `settings.ts:25-30` | Errors returned as a message | Writes to the server's working directory | Question, low |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Type / confidence |
|---------|----------|-----------------|--------------|-------------------|
| Long sequential crawls inside one source budget | `malmo-opera.ts:16,55` (30 pages), `tickster-malmo.ts:19-21` (25 pages), `moriska.ts:17` (15 pages), each request up to 8 s | [TODO] actual durations; visible on `/admin` | Cold cache can exceed `timeoutMs` and show the source as failed | Risk, medium |
| Background work after timeout | `aggregate.ts:11-26` | — | Wasted upstream calls | Confirmed, high |
| Detail-page cache not remote | `fetch-page.ts:13` `"use cache"` vs `fetch-source.ts:44` `"use cache: remote"` | — | On serverless, each instance may refetch detail pages [TODO verify handler semantics in Next 16 docs] | Risk, medium |
| Per-day counts computed by full scans | `calendar-view.tsx:112`, `event-map-view.tsx:63` `countFor` reduce over all events per rendered day | — | Grows with events × days shown | Risk, low |
| Venue page builds every venue to show one | `app/venues/[slug]/page.tsx:44` | — | Linear in events; fine at current size | Risk, low |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal (90 days, scan) | Type |
|------|-------------|------------------------------|------|
| `src/app/globals.css` (645 lines) | Largest source file; holds theme, map pin and popup styles | 12 commits | Confirmed |
| `src/components/map/event-map-view.tsx` (258 lines) | Bottom-sheet gestures, filtering and layout in one component | 7 | Confirmed |
| `src/components/map/leaflet-map.tsx` (322 lines) | Imperative Leaflet code, DOM-built popups, clustering | 6 | Confirmed |
| `src/components/events/event-results.tsx`, `event-card.tsx` | Discover's main path | 6 each | Confirmed |
| `src/components/layout/nav-tabs.tsx` (242 lines) | Desktop + mobile nav, admin toggle, saved count, filter carry-over | 6 | Confirmed |
| `src/components/filters/filter-bar.tsx` (404 lines) | Two variants (inline and floating) in one file | not in top 20 | Confirmed (size) |
| `src/lib/events/sources/moriska.ts`, `index.ts`, `aggregate.ts`, `venues.ts` | Scraping heuristics; registry | 4–5 | Confirmed |

### 6) `[ASK USER]` Questions

1. [ASK USER] Is `src/lib/events/jsonld.ts` a building block you want to keep for future sources (README recommends it), or unused code?
2. [ASK USER] Which list should own venue coordinates: `venues.ts`, the adapters' `VENUE` constants, or both on purpose?
3. [ASK USER] Is the per-adapter difference in past-event cut-offs (−6 h, "today", none) intentional?
4. [ASK USER] Is the "Slutsålt." prefix in `description` (Malmö Live, Slagthuset) wanted in addition to the `soldOut` flag?
5. [ASK USER] Should the default event length be the same in the app (3 h) and in the exported .ics (2 h)?
6. [ASK USER] Are the shorter "When" labels in the segmented control ("Weekend", "7 days") intentional?
7. [ASK USER] On Vercel, are admin on/off switches expected to work? `settings.ts` says to replace the file store before deploying to serverless, while CLAUDE.md says the app is deployed on Vercel.
8. [ASK USER] Is the admin protection gap (R3) in scope for this work, or only to be flagged before a public launch as CLAUDE.md says?

### 7) Evidence

- `docs/codebase/.codebase-scan.txt` (TODO / FIXME / HACK, HIGH-CHURN FILES, CODE METRICS)
- `src/lib/days.ts`, `src/components/calendar/calendar-view.tsx`, `src/components/map/event-map-view.tsx`, `src/components/filters/filter-bar.tsx`, `src/components/filters/filter-panel.tsx`
- `src/lib/events/aggregate.ts`, `fetch-page.ts`, `fetch-source.ts`, `filters.ts`, `format.ts`, `map.ts`, `demo-dates.ts`, `jsonld.ts`, `http.ts`, `venues.ts`, `map-data.ts`, `calendar-data.ts`, `week-data.ts`
- `src/lib/events/sources/{tickster,moriska,malmo-opera,malmo-stadsteater,malmo-live,slagthuset,inkonst}.ts`
- `src/app/tonight/page.tsx`, `src/app/admin/actions.ts`, `src/app/venues/[slug]/page.tsx`, `src/components/map/leaflet-map.tsx`, `src/components/events/source-status.tsx`, `src/lib/ics.ts`
