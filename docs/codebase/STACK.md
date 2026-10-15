# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript (`strict: true`), ~8,700 lines in `src/` (excluding `globals.css`) | `tsconfig.json`, `wc -l` over `src/` |
| Runtime + version | Node.js; exact version not pinned (no `.nvmrc`, no `engines` field). `@types/node` is `^20`. | `package.json` |
| Package manager | npm (lockfile v3) | `package-lock.json` |
| Module/build system | Next.js 16.4.0 with Turbopack, ES modules, `moduleResolution: "bundler"` | `package.json`, `next.config.ts`, `tsconfig.json` |

### 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| next | 16.4.0 | App Router, `cacheComponents`, `partialPrefetching`, Server Actions, `"use cache: remote"` | `package.json`, `next.config.ts`, `src/lib/events/fetch-source.ts` |
| react / react-dom | 19.3.0 | UI, `cache()`, `useSyncExternalStore` | `package.json`, `src/lib/events/aggregate.ts`, `src/lib/saved.ts` |
| cheerio | ^1.2.0 | HTML scraping in source adapters | `src/lib/events/scrape.ts` |
| leaflet + leaflet.markercluster | ^1.9.4 / ^1.5.3 | Map rendering and pin clustering | `src/components/map/leaflet-map.tsx` |
| maplibre-gl + @maplibre/maplibre-gl-leaflet | ^6.14.0 / ^0.1.4 | Vector basemap (OpenFreeMap) inside Leaflet | `src/components/map/basemap.ts` |
| radix-ui | ^1.7.0 | Primitives behind shadcn/ui components | `src/components/ui/*`, `components.json` |
| server-only | ^0.0.1 | Build-time guard on server modules | `src/lib/events/*.ts`, `src/lib/events/sources/*.ts` |
| clsx, tailwind-merge, class-variance-authority, lucide-react | see manifest | Class composition (`cn`), variants, icons | `src/lib/utils.ts`, `src/components/ui/button.tsx` |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| ESLint 9 + eslint-config-next 16.4.0 (core-web-vitals, typescript) | Lint | `eslint.config.mjs` |
| TypeScript ^5 | Type check (`noEmit`) | `tsconfig.json` |
| Tailwind CSS v4 via `@tailwindcss/turbopack` loader | Styling, configured in CSS | `next.config.ts`, `src/app/globals.css` |
| tw-animate-css | Animation utilities | `package.json` |
| No formatter (Prettier) config | — | scan: only `eslint.config.mjs` and `tsconfig.json` found |
| No test runner | — | `package.json` has no `test` script |

### 4) Key Commands

```bash
npm install
npm run build          # next build
# no test command exists
npm run lint           # eslint
npx tsc --noEmit       # type check (from CLAUDE.md)
EVENTS_LIVE=false npm run dev   # fixtures only, no network
```

Terminal check during this analysis: `node_modules/` is not installed in this checkout, so `npm run lint` failed with `eslint: command not found`, and `npx tsc` resolved to an unrelated npm package named `tsc` instead of TypeScript. [TODO] Baseline lint, type check and build results once dependencies are installed.

### 5) Environment and Config

- Config sources: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `components.json`, `src/lib/events/config.ts`
- Env vars read in code: `EVENTS_LIVE` (`src/lib/events/config.ts:6`), `DEMO_SOURCE_FAILURE` (`src/lib/events/sources/skane-culture.ts:15`). No `.env.example` exists; `.env*` is gitignored.
- Deployment/runtime constraints: Vercel, from `main` (CLAUDE.md). The remote cache (`"use cache: remote"`) is Vercel Runtime Cache. Admin settings write to `.data/source-settings.json` on the local file system (`src/lib/events/settings.ts:15`), which is gitignored and per-instance on serverless.

### 6) Evidence

- `package.json`, `package-lock.json`
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore`
- `src/lib/events/config.ts`, `src/lib/events/settings.ts`
- `docs/codebase/.codebase-scan.txt` (sections STACK DETECTION, LINTING AND FORMATTING CONFIG, ENVIRONMENT VARIABLE TEMPLATES)
