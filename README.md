# Malevents

What's on in Malmö: one page that gathers events from many APIs.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind v4 and shadcn/ui. Dark theme only.

## Pages

- `/` Events: cards with search, date, category, source and "free only" filters (kept in the URL).
- `/map` Map: pick a day in the next two weeks and see where events are. Uses [Leaflet](https://leafletjs.com) with the free standard OpenStreetMap tiles, darkened with CSS (no API key; keep the attribution, and move to a hosted tile plan if traffic grows, per the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/)).
- `/admin` Admin (shown in the nav when "Admin mode" is switched on in the header; there is no login): health, event count, last fetch, response time and cache lifetime per source; refresh a source's cache; switch a source off for visitors; drill into a source's normalized events.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How the event sources work

```
src/lib/events/
  types.ts            MalmoEvent (normalized shape) and EventSource (adapter contract)
  sources/            one adapter per upstream API
    index.ts          the registry: add new adapters here
  aggregate.ts        fans out to every source in parallel and merges results
  filters.ts          URL search params -> filters, applied on the server
  http.ts, jsonld.ts  shared fetch helpers (timeouts, schema.org Event parsing)
```

- **One adapter per API.** Each adapter fetches its upstream data and maps it into `MalmoEvent`. The rest of the app only ever sees the normalized shape.
- **Cached per source.** `fetch-source.ts` is the single `"use cache"` entry point. Each source sets its own `cacheProfile` and is tagged `events` and `events:<source-id>`, so the admin can refresh one source on its own. Failures are cached only for seconds.
- **Locations.** Adapters pass through coordinates when the upstream has them; otherwise `venues.ts` looks up known Malmö venues. The admin flags events without a location.
- **Failures are isolated.** The aggregator runs all sources with `Promise.allSettled` and a per-source timeout. A source that fails or times out shows as offline in the UI and the other sources still render.
- **De-duplication.** Events with the same normalized title and start time are merged, keeping the richer record.
- **Streaming.** The page header is prerendered as a static shell; results depend on search params and stream in behind a skeleton.

### Adding a source

1. Create `src/lib/events/sources/<name>.ts` with a `fetchEvents` function that returns `MalmoEvent[]` (see `malmo-live.ts` or `slagthuset.ts` for a JSON API, `moriska.ts` for scraping HTML; `jsonld.ts` parses sites that publish schema.org JSON-LD). Caching is applied for you.
2. Export an `EventSource` object and add it to `SOURCES` in `sources/index.ts`.
3. Put API keys in environment variables and read them inside the adapter only; adapters are `server-only`.

### Venue sources

None of these venues offers a documented, keyless API, so each adapter uses the most structured public data the site itself loads. Requests send a `MaleventsBot` user agent and are cached for hours.

| Source | Method | Endpoint |
| --- | --- | --- |
| Malmö Live Konserthus (Clarion Hotel & Congress Malmö Live building) | JSON feed behind the site's own programme listing, one row per performance | `https://malmolive.se/api/events` |
| Slagthuset | Open WordPress REST API (headless WP behind the Next.js site), `events` post type with ACF fields | `https://wp.slagthuset.se/wp-json/wp/v2/events` |
| Moriska Paviljongen | Programme pages scraped for dates (the REST API omits them), joined on the event link with the WordPress REST API for title, text and image, then each event page for the year, price and Nortic ticket link | `https://moriskapaviljongen.se/biljetter-program-2/` + `/wp-json/wp/v2/mp_event` |
| Malmö Opera | Server-rendered calendar (one row per performance, `?page=N`), plus each production page's Open Graph image and text. Touring dates sold via Riksteatern are skipped. | `https://www.malmoopera.se/malmo-opera` |
| Inkonst | Its public Tickster organizer page (the event date is in each link), plus each Tickster event page for start time, price and image. `sources/tickster.ts` turns any Tickster organizer page into a source. | `https://www.tickster.com/se/sv/events/by/bkz8z545crn3x5m/inkonst` |

HTML is parsed with [cheerio](https://cheerio.js.org/). `scrape.ts` finds event "cards" by their links rather than by theme class names, and parses Swedish dates ("fre 9 okt 19.00", "26 november 2026 | 18:30"), inferring the year when a listing leaves it out. Detail pages go through `fetchDetailPage`, which caches each page for days, so an hourly refresh only fetches pages for events it hasn't seen; at most 3–4 are fetched at once.

Events can carry `ticketUrl`, `soldOut` and `notes` (hall, doors, age limit) when the upstream has them; cards show a Tickets link or "Sold out".

### Live and demo data

Sources with a live endpoint fetch it by default. Sources that only have demo fixtures (Malmö stad, ticket marketplace, Skåne culture) start switched off in live mode so made-up events never mix with real ones; the admin can switch them on. With `EVENTS_LIVE=false`, every source serves bundled fixtures in its upstream's real shape (marked "demo" in the UI), with dates relative to today.

| Variable | Effect |
| --- | --- |
| `EVENTS_LIVE=false` | Every adapter serves its fixtures instead of calling its live endpoint (for offline work or sandboxes that can't reach the venue sites). |
| `DEMO_SOURCE_FAILURE=true` | Makes the Skåne culture source fail, to see how the page degrades. |

Admin on/off settings are saved to `.data/source-settings.json`. That works locally and on a single long-running server; on serverless hosting, swap `src/lib/events/settings.ts` for a database or KV store.
