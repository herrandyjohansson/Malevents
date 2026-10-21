import type { SourceStatus } from "./types";

/** Names of the sources that hadn't answered when the page rendered (see getAllEvents' "fast" mode). */
export function pendingNames(sources: Pick<SourceStatus, "name" | "state">[]) {
  return sources.filter((s) => s.state === "pending").map((s) => s.name);
}
