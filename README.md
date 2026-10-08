# Malevents

What's on in Malmö: one page that gathers events from many APIs.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind v4 and shadcn/ui. Dark theme only.

## Pages

- `/` Events: cards with search, date, category, source and "free only" filters (kept in the URL).
- `/map` Map: pick a day in the next two weeks and see where events are. Uses [Leaflet](https://leafletjs.com) with free CARTO Dark Matter tiles over OpenStreetMap data (no API key; keep the attribution).
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

1. Create `src/lib/events/sources/<name>.ts` with a `fetchEvents` function that returns `MalmoEvent[]` (see `malmo-stad.ts` for a JSON API, `malmo-live.ts` for sites that publish schema.org JSON-LD). Caching is applied for you.
2. Export an `EventSource` object and add it to `SOURCES` in `sources/index.ts`.
3. Put API keys in environment variables and read them inside the adapter only; adapters are `server-only`.

### Demo data

All sources currently serve bundled demo fixtures (marked "demo" in the UI) with dates relative to today.

| Variable | Effect |
| --- | --- |
| `EVENTS_LIVE=true` | Adapters with a live endpoint call it instead of fixtures (currently `malmo-live`, which reads JSON-LD from the venue site). |
| `DEMO_SOURCE_FAILURE=true` | Makes the Skåne culture source fail, to see how the page degrades. |

Admin on/off settings are saved to `.data/source-settings.json`. That works locally and on a single long-running server; on serverless hosting, swap `src/lib/events/settings.ts` for a database or KV store.
