# OpenWeb benchmark

Test-only comparison of [OpenWeb](https://github.com/openweb-org/openweb) against the current adapters in `src/lib/events/sources/`, for the same venues. Nothing here is used by the app.

## What it compares

| Venue | Current adapter | OpenWeb package (`home/sites/`) |
|---|---|---|
| Slagthuset | WordPress REST `wp.slagthuset.se/wp-json/wp/v2/events` | Same endpoint, `node` transport |
| Malmö Live | Drupal JSON `malmolive.se/api/events` | Same endpoint, `node` transport |
| Plan B | Featured items in the home page's `__NEXT_DATA__` | `planbmalmo.com/api/eventsEdge`, found with `openweb capture`: the full programme the page loads in the browser |

Where the upstream is the same, the OpenWeb side maps through the adapter's own `*ToEvent` function, so only fetching differs. Plan B's feed has a different shape and is mapped by `planb-edge.ts`.

Per venue and side it measures success rate, median and p95 time, event count, how many events have each field (start time, end time, price, description, image, ticket link), whether a sample of event links load, the overlap in event ids, and whether a browser is needed (a browser would rule out running on Vercel).

## Running

Needs the CLI: `npm install -g @openweb-org/openweb`. `OPENWEB_HOME` is set to `home/` by the helpers, so your own `~/.openweb` is not touched.

```bash
npm test                          # mapping unit tests + packages load (no network)
npm run test:live                 # both sides return valid events; OpenWeb finds every event the adapter finds
npm run bench:openweb             # 5 rounds per side, writes results/latest.{md,json}
BENCH_ROUNDS=10 npm run bench:openweb
```

## Reading the numbers

- OpenWeb times include starting its CLI (about 300 ms, reported separately); the adapters run in-process. Compare medians after subtracting that.
- With 5 rounds the p95 is the slowest run, so one slow upstream answer dominates it.
- The link check is a 5-link sample per side and can catch an upstream blip; identical URLs on both sides can score differently.
- To add a venue: add a package under `home/sites/<name>/` (`manifest.json`, `openapi.yaml`, `examples/`) and an entry in `venues.ts`.
