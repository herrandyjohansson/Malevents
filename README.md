# Malevents

What's on in Malmö: one page that gathers events from many APIs.

Built with Next.js 16 (App Router, Cache Components), React 19, Tailwind v4 and shadcn/ui.

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
- **Cached per source.** Each adapter's fetch function uses `"use cache"` with `cacheLife("hours")` and is tagged `events` and `events:<source-id>`, so a source can be refreshed on its own with `revalidateTag`.
- **Failures are isolated.** The aggregator runs all sources with `Promise.allSettled` and a per-source timeout. A source that fails or times out shows as offline in the UI and the other sources still render.
- **De-duplication.** Events with the same normalized title and start time are merged, keeping the richer record.
- **Streaming.** The page header is prerendered as a static shell; results depend on search params and stream in behind a skeleton.

### Adding a source

1. Create `src/lib/events/sources/<name>.ts` with a `"use cache"` function that returns `MalmoEvent[]` (see `malmo-stad.ts` for a JSON API, `malmo-live.ts` for sites that publish schema.org JSON-LD).
2. Export an `EventSource` object and add it to `SOURCES` in `sources/index.ts`.
3. Put API keys in environment variables and read them inside the adapter only; adapters are `server-only`.

### Demo data

All sources currently serve bundled demo fixtures (marked "demo" in the UI) with dates relative to today.

| Variable | Effect |
| --- | --- |
| `EVENTS_LIVE=true` | Adapters with a live endpoint call it instead of fixtures (currently `malmo-live`, which reads JSON-LD from the venue site). |
| `DEMO_SOURCE_FAILURE=true` | Makes the Skåne culture source fail, to see how the page degrades. |
