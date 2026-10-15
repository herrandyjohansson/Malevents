# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | kebab-case | `fetch-source.ts`, `event-map-view.tsx` | `src/` listing |
| Functions/methods | camelCase; React components PascalCase | `getAllEvents`, `parseSwedishDate`, `EventCard` | `aggregate.ts`, `scrape.ts`, `event-card.tsx` |
| Types/interfaces | PascalCase, `interface` for object shapes | `MalmoEvent`, `EventSource`, `SourceStatus` | `src/lib/events/types.ts` |
| Constants/env vars | SCREAMING_SNAKE_CASE for module constants; env vars upper-case | `LIVE_MODE`, `DEFAULT_SOURCE_TIMEOUT_MS`, `EVENTS_LIVE` | `src/lib/events/config.ts` |
| Adapter ids | `const ID = "<kebab-id>"`, event ids `<sourceId>:<upstreamId>` | `ID = "malmo-live"` | `sources/malmo-live.ts:10`, `types.ts:21` |

No private-member prefixes are used; there are no classes apart from `SourceError` (`http.ts:3`).

### 2) Formatting and Linting

- Formatter: none configured (no Prettier or EditorConfig). [TODO] Whether formatting is enforced by an editor setting.
- Linter: ESLint 9 flat config extending `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` (`eslint.config.mjs`).
- Rule suppressions in code: `react-hooks/exhaustive-deps` is disabled inline four times (`components/map/event-map-view.tsx:55-56`, `components/calendar/calendar-view.tsx:94-95`).
- Run commands: `npm run lint`, `npx tsc --noEmit` (could not run here; dependencies not installed).
- TypeScript: `strict: true`, `isolatedModules`, `allowJs` (`tsconfig.json`).

### 3) Import and Module Conventions

- Import grouping/order: external packages first, then `@/` imports, then relative imports, separated by blank lines (e.g. `aggregate.ts:1-9`, `event-results.tsx:1-12`).
- Alias vs relative: relative within `lib/events/`, `@/` across folders.
- Barrels: none, except `sources/index.ts` as the source registry.
- `import "server-only"` at the top of adapters and of server modules (`aggregate.ts`, `fetch-source.ts`, `http.ts`, `settings.ts`, `*-data.ts`). Helpers used from both sides (`filters.ts`, `format.ts`, `days.ts`, `types.ts`) do not import it. `scrape.ts` (cheerio) and `html.ts` do not import it either.

### 4) Error and Logging Conventions

- Adapters throw (`SourceError` carries the source id, `http.ts:3-11`); optional enrichment steps swallow errors per item (`.catch(() => ({}))` in `tickster.ts:153`, `moriska.ts:171`, `malmo-opera.ts:83`, `malmo-stadsteater.ts:103`), and later listing pages swallow errors after page 1 (`tickster.ts:119-122`, `moriska.ts:135-138`, `malmo-opera.ts:59-61`, `slagthuset.ts:104-107`).
- `fetchSource` converts errors to `{ ok: false, error }` (`fetch-source.ts:52-55`); `loadSource` converts them to a status (`aggregate.ts:59-64`).
- Server Actions return `{ ok: false, error }` for expected failures (`actions.ts:16-20`).
- Logging: `console.error` only, in `aggregate.ts:60` and `app/error.tsx:9`. No logging library, no structured fields. No redaction rules (no secrets exist).

### 5) Testing Conventions

- Test file naming/location rule: none; there are no tests (see `TESTING.md`).
- Mocking strategy norm: bundled fixtures per adapter, switched on by `EVENTS_LIVE=false` (e.g. `demoRows()` in `malmo-live.ts:114`, `demoProgramHtml()` in `moriska.ts:197`).
- Coverage expectation: [TODO] none stated.

### 6) Date and Label Conventions (from CLAUDE.md, checked against code)

- Dates are ISO strings in data and shown in Malmö time: followed (`types.ts:15-19`, `config.ts:8`).
- "Labels rendered on both server and client are formatted by hand (not `Intl`)": `lib/days.ts:79-119` follows it. `components/calendar/calendar-view.tsx:51-57` (a client component) uses `Intl.DateTimeFormat` for the month heading and day labels. `components/saved/saved-list.tsx` (client) calls `formatEventDate` (Intl) from `lib/events/format.ts`, but renders a skeleton on the server and its content only after hydration (`saved-list.tsx:35-39`), so it cannot mismatch. Server-only components (`event-card.tsx`, `week-board.tsx`, `venues/[slug]/page.tsx:102`) also use Intl, which the convention allows.

### 7) Evidence

- `eslint.config.mjs`, `tsconfig.json`
- `src/lib/events/types.ts`, `src/lib/events/http.ts`, `src/lib/events/aggregate.ts`, `src/lib/events/fetch-source.ts`
- `src/lib/days.ts`, `src/lib/events/format.ts`, `src/components/calendar/calendar-view.tsx`, `src/components/saved/saved-list.tsx`
- `src/app/admin/actions.ts`, `src/app/error.tsx`
