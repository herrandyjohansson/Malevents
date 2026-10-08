import "server-only";

import { DEFAULT_SOURCE_TIMEOUT_MS } from "./config";
import { SourceError } from "./http";
import { SOURCES } from "./sources";
import type { EventSource, MalmoEvent, SourceStatus } from "./types";

function withTimeout<T>(source: EventSource, promise: Promise<T>): Promise<T> {
  const ms = source.timeoutMs ?? DEFAULT_SOURCE_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new SourceError(source.id, `Timed out after ${ms} ms`)), ms);
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

/** Keep the richer of two records describing the same event. */
function score(event: MalmoEvent) {
  return Object.values(event).filter((v) => v !== undefined && v !== "").length;
}

/**
 * Fan out to every source in parallel. Each source caches its own result,
 * so a slow or failing upstream only affects itself: failures are reported
 * in `sources` and the remaining events still render.
 */
export async function getAllEvents(): Promise<{ events: MalmoEvent[]; sources: SourceStatus[] }> {
  const settled = await Promise.allSettled(SOURCES.map((s) => withTimeout(s, s.fetchEvents())));

  const sources: SourceStatus[] = [];
  const byKey = new Map<string, MalmoEvent>();

  settled.forEach((result, i) => {
    const { id, name, demo = false } = SOURCES[i];
    if (result.status === "rejected") {
      const error = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`Event source "${id}" failed:`, result.reason);
      sources.push({ id, name, demo, ok: false, error });
      return;
    }
    sources.push({ id, name, demo, ok: true, count: result.value.length });
    for (const event of result.value) {
      const key = dedupeKey(event);
      const existing = byKey.get(key);
      if (!existing || score(event) > score(existing)) byKey.set(key, event);
    }
  });

  const events = [...byKey.values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return { events, sources };
}
