import "server-only";
import { cache } from "react";

import { errorMessage, log, since } from "@/lib/log";

import { DEFAULT_SOURCE_TIMEOUT_MS } from "./config";
import { fetchSource } from "./fetch-source";
import { SourceError } from "./http";
import { getSourceSettings } from "./settings";
import { isEnabledByDefault, SOURCES } from "./sources";
import type { EventSource, MalmoEvent, SourceStatus } from "./types";

function withTimeout<T>(source: EventSource, promise: Promise<T>): Promise<T> {
  const ms = source.timeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new SourceError(source.id, `Timed out after ${ms} ms`, "timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function dedupeKey(event: MalmoEvent) {
  const title = event.title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "");
  return `${title}|${new Date(event.startsAt).toISOString().slice(0, 16)}`;
}

/** How many fields a record has filled in; of two duplicates, the richer one is kept. */
function filledFieldCount(event: MalmoEvent) {
  return Object.values(event).filter((v) => v !== undefined && v !== "").length;
}

/**
 * Fetch one source with a timeout, never throwing: failures come back as a
 * status so callers can show them next to the results.
 */
export async function loadSource(
  source: EventSource,
  enabled = true,
): Promise<{ status: SourceStatus; events: MalmoEvent[] }> {
  const base = { id: source.id, name: source.name, demo: source.demo ?? false, enabled };
  if (!enabled) return { status: { ...base, state: "disabled", count: 0 }, events: [] };

  const started = performance.now();
  try {
    const result = await withTimeout(source, fetchSource(source.id));
    const durationMs = since(started);
    if (!result.ok) throw new Error(result.error);
    const { events, warnings, fetchedAt } = result;
    const status: SourceStatus = { ...base, state: "ok", count: events.length, fetchedAt, durationMs };
    if (warnings.length > 0) status.warnings = warnings;
    return { status, events };
  } catch (err) {
    const durationMs = since(started);
    const error = errorMessage(err);
    // A failed fetch is already logged by fetchSource on its cache miss; this line is per request.
    log.warn("source.unavailable", { source: source.id, durationMs, error });
    return { status: { ...base, state: "error", count: 0, error, durationMs }, events: [] };
  }
}

/**
 * Fan out to every enabled source in parallel. Each source is cached on its
 * own, so a slow or failing upstream only affects itself: failures are
 * reported in `sources` and the remaining events still render.
 *
 * Wrapped in React's `cache` so components on the same page (the home page's
 * week map and event list) share one lookup and merge per request.
 */
export const getAllEvents = cache(async (): Promise<{ events: MalmoEvent[]; sources: SourceStatus[] }> => {
  const started = performance.now();
  const startedAt = Date.now();
  const settings = await getSourceSettings();
  const results = await Promise.all(SOURCES.map((s) => loadSource(s, settings[s.id]?.enabled ?? isEnabledByDefault(s))));

  let merged = 0;
  const byKey = new Map<string, MalmoEvent>();
  for (const { events } of results) {
    merged += events.length;
    for (const event of events) {
      const key = dedupeKey(event);
      const existing = byKey.get(key);
      if (!existing || filledFieldCount(event) > filledFieldCount(existing)) byKey.set(key, event);
    }
  }

  const events = [...byKey.values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const sources = results.map((r) => r.status);
  logAggregate(sources, startedAt, merged, events.length, since(started));
  return { events, sources };
});

/**
 * One line per request that loads events: totals, and per source its state,
 * wait time and the age of the cached copy. A copy fetched after the request
 * started came from the upstream during it (a cache miss).
 */
function logAggregate(sources: SourceStatus[], startedAt: number, merged: number, kept: number, durationMs: number) {
  const now = Date.now();
  const perSource = Object.fromEntries(
    sources
      .filter((s) => s.state !== "disabled")
      .map((s) => {
        const fetchedAt = s.fetchedAt ? Date.parse(s.fetchedAt) : undefined;
        const cache = fetchedAt === undefined ? undefined : fetchedAt >= startedAt ? "miss" : "hit";
        const ageS = fetchedAt === undefined ? undefined : Math.round((now - fetchedAt) / 1000);
        return [s.id, { state: s.state, count: s.count, ms: s.durationMs, cache, ageS }];
      }),
  );
  const slowest = sources.reduce<SourceStatus | undefined>(
    (max, s) => ((s.durationMs ?? 0) > (max?.durationMs ?? 0) ? s : max),
    undefined,
  );
  log.info("events.loaded", {
    durationMs,
    events: kept,
    duplicates: merged - kept,
    ok: sources.filter((s) => s.state === "ok").length,
    failed: sources.filter((s) => s.state === "error").length,
    disabled: sources.filter((s) => s.state === "disabled").length,
    slowest: slowest?.id,
    sources: perSource,
  });
}
