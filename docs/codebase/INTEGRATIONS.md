# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System | Type | Purpose | Auth model | Criticality | Evidence |
|--------|------|---------|------------|-------------|----------|
| malmolive.se `/api/events` | JSON API (Drupal export) | Malmö Live programme | none | med | `sources/malmo-live.ts:11-12, 94` |
| wp.slagthuset.se WP REST | JSON API | Slagthuset events, 4 pages × 100 in parallel | none | med | `sources/slagthuset.ts:12-15, 101-112` |
| moriskapaviljongen.se | HTML (programme, up to 15 pages) + WP REST + detail pages | Moriska Paviljongen | none | med | `sources/moriska.ts:13-21, 127-175` |
| malmoopera.se | HTML calendar (up to 30 pages) + production pages | Malmö Opera | none | med | `sources/malmo-opera.ts:12-17, 53-87` |
| malmostadsteater.se | HTML calendar + production pages | Malmö Stadsteater | none | med | `sources/malmo-stadsteater.ts:12-15, 96-106` |
| tickster.com | HTML listing pages + up to 150 event pages per source | Inkonst and all Tickster events in Malmö | none | high (largest volume, ~300 events per comment) | `sources/tickster.ts`, `inkonst.ts`, `tickster-malmo.ts:6-21` |
| Fixture-only sources | none | `malmo-stad`, `ticket-marketplace`, `skane-culture` serve bundled data, off by default in live mode | n/a | low | `malmo-stad.ts:39-45`, `ticket-marketplace.ts:36-37`, `skane-culture.ts`, `sources/index.ts:48-50` |
| OpenFreeMap "Fiord" style | Map tiles (browser) | Vector basemap | none | low (falls back to OSM raster) | `components/map/basemap.ts` |
| OpenStreetMap raster tiles | Map tiles (browser) | Fallback basemap | none | low | `components/map/basemap.ts`, CLAUDE.md |
| Remote images | Browser `<img>` | Event images from upstream URLs | none | low | `components/events/remote-image.tsx` |
| Google Fonts via `next/font` | Build-time | Geist fonts | none | low | `src/app/layout.tsx:2, 8-16` |

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| Vercel Runtime Cache (`"use cache: remote"`) | Per-source event lists, tags `events`, `events:<id>` | `fetch-source.ts` | Only shared cache; lifetime per `cacheProfile` | `fetch-source.ts:22-26, 43-58` |
| Next.js `"use cache"` (default handler) | Detail pages, `cacheLife("days")` | `fetch-page.ts` | Not the remote handler, so on serverless it is per instance [TODO confirm the default handler's behaviour on Vercel in `node_modules/next/dist/docs/`] | `fetch-page.ts:12-17` |
| `.data/source-settings.json` | Admin on/off per source | `settings.ts` | Per-instance / read-only on serverless; gitignored | `settings.ts:5-15`, `.gitignore` |
| Browser `localStorage` | Saved events (`malevents:saved`), admin mode (`malevents:admin-mode`) | `lib/saved.ts`, `lib/admin-mode.ts` | Per browser only | files |

### 3) Secrets and Credentials Handling

- Credential sources: none. No API keys are used.
- Hardcoding checks: no secrets found. Hardcoded values are public URLs, a contact `USER_AGENT` (`http.ts:17`), and venue coordinates.
- Rotation or lifecycle notes: not applicable.

### 4) Reliability and Failure Behavior

- Retry/backoff: none. Failures are cached for seconds (`fetch-source.ts:53`) so a broken upstream is not hit on every request.
- Timeout policy: per request 8 s by default (`http.ts:43, 53`, `jsonld.ts:69`); per source `timeoutMs` (default 8 s in `config.ts:11`; Tickster sources 45 s `tickster.ts:184`; Moriska, Opera, Stadsteater 30 s). The source timeout rejects the promise but does not abort in-flight requests (`aggregate.ts:11-26`).
- Fallbacks: page 1 of a listing is required, later pages are best-effort; detail enrichment falls back to empty data per event; failed sources render as a status chip and warning (`components/events/source-status.tsx`).
- Politeness: concurrency limit of 3–4 for detail pages (`scrape.ts:133` `mapLimit`), `USER_AGENT` header on requests made through `http.ts`. `jsonld.ts:72` calls `fetch` directly without that header.

### 5) Observability for Integrations

- Logging: one `console.error` per failed source (`aggregate.ts:60`).
- Metrics/tracing: none in code. The admin page shows state, count, last fetch time and duration per source (`app/admin/page.tsx`, `app/admin/sources/[id]/page.tsx:62-64`).
- Gaps: failed detail-page fetches and failed later listing pages are silent (caught and dropped), so partial data is not visible in the admin.

### 6) Evidence

- `src/lib/events/http.ts`, `fetch-source.ts`, `fetch-page.ts`, `aggregate.ts`, `settings.ts`, `config.ts`, `jsonld.ts`
- `src/lib/events/sources/*.ts`
- `src/components/map/basemap.ts`, `src/app/layout.tsx`
