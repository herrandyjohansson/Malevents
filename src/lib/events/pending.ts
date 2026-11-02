import type { SourceStatus } from "./types";

/** Names of the sources that hadn't answered when the page rendered (see getAllEvents' "fast" mode). */
export function pendingNames(sources: Pick<SourceStatus, "name" | "state">[]) {
  return sources.filter((s) => s.state === "pending").map((s) => s.name);
}

/**
 * The sources visitors are offered (source list, "Listing sites" filter):
 * those with events right now. A source that is off, down or still loading is
 * left out rather than shown empty; the admin shows its state.
 */
export function listedSources<T extends Pick<SourceStatus, "enabled" | "state" | "count">>(sources: T[]) {
  return sources.filter((s) => s.enabled && s.state === "ok" && s.count > 0);
}
