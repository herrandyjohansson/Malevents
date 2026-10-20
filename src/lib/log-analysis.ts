import "server-only";

import type { LogEntry, LogLevel } from "./log";

/*
 * Turns the in-memory log buffer into what the admin's Logs page shows:
 * headline numbers, a row per source and the filtered stream. The filters
 * live in the URL so a view can be shared.
 */

export const LOG_WINDOWS = [
  { value: "15m", label: "15 min", ms: 15 * 60_000 },
  { value: "1h", label: "1 hour", ms: 60 * 60_000 },
  { value: "all", label: "Since start", ms: Infinity },
] as const;
export type LogWindow = (typeof LOG_WINDOWS)[number]["value"];

/** The lowest level the stream shows. */
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const satisfies readonly LogLevel[];
const RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface LogFilters {
  window: LogWindow;
  /** Empty for every source. */
  source: string;
  level: LogLevel;
  /** Empty for every event. */
  event: string;
  q: string;
}

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string) {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Parse untrusted search params into valid filters. */
export function parseLogFilters(params: Params): LogFilters {
  const window = one(params, "window");
  const level = one(params, "level");
  return {
    window: LOG_WINDOWS.some((w) => w.value === window) ? (window as LogWindow) : "all",
    source: one(params, "source").slice(0, 60),
    level: (LOG_LEVELS as readonly string[]).includes(level) ? (level as LogLevel) : "info",
    event: one(params, "event").slice(0, 60),
    q: one(params, "q").trim().slice(0, 100),
  };
}

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function str(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

/** The value at fraction `p` (0–1) of the sorted list, or undefined if it's empty. */
function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return undefined;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : undefined;
}

interface LoadedSource {
  state?: string;
  ms?: number;
  cache?: "hit" | "miss";
}

function loadedSources(entry: LogEntry): Record<string, LoadedSource> {
  const sources = entry.sources;
  return sources && typeof sources === "object" ? (sources as Record<string, LoadedSource>) : {};
}

export interface SourceRow {
  id: string;
  /** Upstream fetches this server made (cache misses), ok and failed. */
  fetches: number;
  fetchFailures: number;
  avgFetchMs?: number;
  lastFetchMs?: number;
  lastFetchAt?: string;
  lastEvents?: number;
  lastUnplaced?: number;
  lastTimeUnknown?: number;
  lastWarning?: string;
  lastError?: string;
  /** Upstream HTTP requests, and the failed ones by reason. */
  requests: number;
  requestFailures: number;
  failureReasons: Record<string, number>;
  avgRequestMs?: number;
  bytes: number;
  /** Page requests that read this source from the cache vs fetched it. */
  cacheHits: number;
  cacheMisses: number;
}

export interface LogAnalysis {
  /** Requests that loaded events, oldest first, for the trend line. */
  loads: { ts: string; ms: number }[];
  loadP50?: number;
  loadP95?: number;
  cacheHits: number;
  cacheMisses: number;
  requests: number;
  requestFailures: number;
  bytes: number;
  warnings: number;
  errors: number;
  sources: SourceRow[];
  /** Event names seen, for the stream's event picker. */
  events: string[];
}

function emptyRow(id: string): SourceRow {
  return { id, fetches: 0, fetchFailures: 0, requests: 0, requestFailures: 0, failureReasons: {}, bytes: 0, cacheHits: 0, cacheMisses: 0 };
}

/** Entries inside the time window, oldest first. */
export function inWindow(entries: readonly LogEntry[], window: LogWindow, now: Date) {
  const ms = LOG_WINDOWS.find((w) => w.value === window)!.ms;
  if (ms === Infinity) return [...entries];
  const from = now.getTime() - ms;
  return entries.filter((e) => Date.parse(e.ts) >= from);
}

/**
 * Headline numbers and a row per source. A source filter narrows everything
 * that belongs to one source; page load times stay site-wide.
 */
export function analyzeLogs(entries: LogEntry[], source: string): LogAnalysis {
  const rows = new Map<string, SourceRow>();
  const row = (id: string) => rows.get(id) ?? rows.set(id, emptyRow(id)).get(id)!;
  const fetchMs = new Map<string, number[]>();
  const requestMs = new Map<string, number[]>();
  const loads: { ts: string; ms: number }[] = [];
  const events = new Set<string>();
  let warnings = 0;
  let errors = 0;

  for (const e of entries) {
    events.add(e.event);
    const id = str(e.source);
    if (source && id !== source && e.event !== "events.loaded") continue;
    if (e.level === "warn") warnings++;
    if (e.level === "error") errors++;

    if (e.event === "events.loaded") {
      const ms = num(e.durationMs);
      if (ms !== undefined) loads.push({ ts: e.ts, ms });
      for (const [sid, s] of Object.entries(loadedSources(e))) {
        if (source && sid !== source) continue;
        if (s.cache === "hit") row(sid).cacheHits++;
        if (s.cache === "miss") row(sid).cacheMisses++;
      }
      continue;
    }
    if (!id) continue;
    const r = row(id);
    switch (e.event) {
      case "source.fetched": {
        r.fetches++;
        const ms = num(e.durationMs);
        if (ms !== undefined) fetchMs.set(id, [...(fetchMs.get(id) ?? []), ms]);
        r.lastFetchMs = ms;
        r.lastFetchAt = e.ts;
        r.lastEvents = num(e.events);
        r.lastUnplaced = num(e.unplaced);
        r.lastTimeUnknown = num(e.timeUnknown);
        const list = Array.isArray(e.warnings) ? e.warnings.filter((w): w is string => typeof w === "string") : [];
        if (list.length) r.lastWarning = list[list.length - 1];
        break;
      }
      case "source.fetch_failed":
        r.fetches++;
        r.fetchFailures++;
        r.lastFetchAt = e.ts;
        r.lastError = str(e.error);
        break;
      case "http.response": {
        r.requests++;
        r.bytes += num(e.bytes) ?? 0;
        const ms = num(e.durationMs);
        if (ms !== undefined) requestMs.set(id, [...(requestMs.get(id) ?? []), ms]);
        break;
      }
      case "http.failed": {
        r.requests++;
        r.requestFailures++;
        const reason = str(e.reason) ?? "other";
        r.failureReasons[reason] = (r.failureReasons[reason] ?? 0) + 1;
        break;
      }
    }
  }

  for (const r of rows.values()) {
    r.avgFetchMs = average(fetchMs.get(r.id) ?? []);
    r.avgRequestMs = average(requestMs.get(r.id) ?? []);
  }
  const sorted = loads.map((l) => l.ms).sort((a, b) => a - b);
  const all = [...rows.values()];
  const sum = (pick: (r: SourceRow) => number) => all.reduce((n, r) => n + pick(r), 0);

  return {
    loads,
    loadP50: percentile(sorted, 0.5),
    loadP95: percentile(sorted, 0.95),
    cacheHits: sum((r) => r.cacheHits),
    cacheMisses: sum((r) => r.cacheMisses),
    requests: sum((r) => r.requests),
    requestFailures: sum((r) => r.requestFailures),
    bytes: sum((r) => r.bytes),
    warnings,
    errors,
    sources: all.sort((a, b) => a.id.localeCompare(b.id)),
    events: [...events].sort(),
  };
}

/** The stream: matching entries, newest first. */
export function filterStream(entries: LogEntry[], f: LogFilters) {
  const q = f.q.toLowerCase();
  const out: LogEntry[] = [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (RANK[e.level] < RANK[f.level]) continue;
    if (f.event && e.event !== f.event) continue;
    if (f.source && e.source !== f.source) continue;
    if (q && !JSON.stringify(e).toLowerCase().includes(q)) continue;
    out.push(e);
  }
  return out;
}
