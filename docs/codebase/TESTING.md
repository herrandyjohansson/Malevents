# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: none. `package.json` has no `test` script and no test dependency; no `*.test.*` or `*.spec.*` files exist under `src/`.
- Assertion/mocking tools: none.
- Commands available as checks (from CLAUDE.md):

```bash
npm run lint
npx tsc --noEmit        # run `npx next typegen` first after adding routes
npm run build
EVENTS_LIVE=false npm run dev   # manual check with fixtures
```

Status in this checkout: `node_modules/` is missing, so none of these could be run during the analysis (`eslint: command not found`). [TODO] Baseline results after `npm install`.

### 2) Test Layout

- Test file placement pattern: not applicable.
- Naming convention: not applicable.
- Setup files: none.

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | no | — | Parsers are exported (`parseTicksterListing`, `parseTicksterDetail`, `parseMoriskaProgram`, `parseMoriskaDetail`, `parseOperaCalendar`, `parseStadsteaterCalendar`, `malmoLiveRowToEvent`, `slagthusetPostToEvent`, `parseSwedishDate`, `inferYear`) but nothing imports them besides their own module. |
| Integration | no | — | — |
| E2E | no | — | — |

### 4) Mocking and Isolation Strategy

- Main approach: each live-capable adapter carries fixtures in the upstream's own format (HTML or JSON) and parses them with the same code path when `EVENTS_LIVE=false` (e.g. `tickster.ts:140-147`, `moriska.ts:161-173`, `malmo-opera.ts:77`). Fixture dates are relative to today (`demo-dates.ts:7-11`), so they always look upcoming.
- `DEMO_SOURCE_FAILURE=true` makes `skane-culture` throw, to show degraded rendering (`skane-culture.ts:15-17`).
- Isolation: not applicable.

### 5) Coverage and Quality Signals

- Coverage tool + threshold: none.
- CI: none (scan: "No CI/CD pipelines detected"); the Vercel preview build is the only automated check (CLAUDE.md).
- Known gaps: date parsing (`scrape.ts`), year inference, time-zone conversion (`demo-dates.ts:18-24`), de-duplication (`aggregate.ts:28-39`), filter parsing (`filters.ts:69-91`) and DST-sensitive day stepping (`week-data.ts:23`) have no automated checks.

### 6) Evidence

- `package.json` (scripts)
- `docs/codebase/.codebase-scan.txt` (CI/CD PIPELINES, PERFORMANCE & TESTING)
- `src/lib/events/sources/*.ts` (exported parsers, fixtures)
- `src/lib/events/sources/skane-culture.ts`, `src/lib/events/demo-dates.ts`
