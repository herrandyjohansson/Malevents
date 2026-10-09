import { malmoLive } from "./malmo-live";
import { malmoStad } from "./malmo-stad";
import { moriska } from "./moriska";
import { skaneCulture } from "./skane-culture";
import { slagthuset } from "./slagthuset";
import { ticketMarketplace } from "./ticket-marketplace";
import type { EventSource } from "../types";

/**
 * Every registered source. To add an API: write an adapter whose
 * fetchEvents returns MalmoEvent[], then add it here.
 */
export const SOURCES: EventSource[] = [
  malmoStad,
  malmoLive,
  slagthuset,
  moriska,
  ticketMarketplace,
  skaneCulture,
];

/** Client-safe metadata about each source (no fetchers). */
export const SOURCE_META = SOURCES.map(({ id, name, homepage, description, kind, endpoint, demo, cacheProfile }) => ({
  id,
  name,
  homepage,
  description,
  kind,
  endpoint,
  demo: demo ?? false,
  cacheProfile: cacheProfile ?? "hours",
}));

export function getSource(id: string) {
  return SOURCES.find((s) => s.id === id);
}

export type SourceMeta = (typeof SOURCE_META)[number];
