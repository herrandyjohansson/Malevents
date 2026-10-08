import { malmoLive } from "./malmo-live";
import { malmoStad } from "./malmo-stad";
import { skaneCulture } from "./skane-culture";
import { ticketMarketplace } from "./ticket-marketplace";
import type { EventSource } from "../types";

/**
 * Every registered source. To add an API: write an adapter that returns
 * MalmoEvent[] from a "use cache" function, then add it here.
 */
export const SOURCES: EventSource[] = [malmoStad, malmoLive, ticketMarketplace, skaneCulture];

/** Client-safe metadata about each source (no fetchers). */
export const SOURCE_META = SOURCES.map(({ id, name, homepage, demo }) => ({
  id,
  name,
  homepage,
  demo: demo ?? false,
}));

export type SourceMeta = (typeof SOURCE_META)[number];
