// Copies MapLibre's web worker into public/ so the browser can load it from a
// plain URL. Turbopack bundles maplibre-gl but not the worker file it locates
// relative to its own module, which made the worker URL resolve to the page
// itself ("Worker failed to load"). basemap.ts points setWorkerUrl here.
// Runs before `dev` and `build` (npm predev/prebuild), so it always matches
// the installed version; the copy is git-ignored.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/package.json"));
const target = join(process.cwd(), "public", "vendor");
mkdirSync(target, { recursive: true });
copyFileSync(join(dist, "dist", "maplibre-gl-worker.mjs"), join(target, "maplibre-gl-worker.mjs"));
