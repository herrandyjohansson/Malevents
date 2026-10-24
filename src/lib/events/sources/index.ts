import { hypnos } from "./hypnos";
import { inkonst } from "./inkonst";
import { malmoArena } from "./malmo-arena";
import { malmoKonsthall } from "./malmo-konsthall";
import { malmoLive } from "./malmo-live";
import { malmoOpera } from "./malmo-opera";
import { malmoStadsteater } from "./malmo-stadsteater";
import { malmoStad } from "./malmo-stad";
import { medley } from "./medley";
import { moriska } from "./moriska";
import { panora } from "./panora";
import { planB } from "./plan-b";
import { skaneCulture } from "./skane-culture";
import { skanesDansteater } from "./skanes-dansteater";
import { slagthuset } from "./slagthuset";
import { spegeln } from "./spegeln";
import { ticksterMalmo } from "./tickster-malmo";
import { ticketMarketplace } from "./ticket-marketplace";
import { LIVE_MODE } from "../config";
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
  malmoOpera,
  malmoStadsteater,
  inkonst,
  malmoKonsthall,
  skanesDansteater,
  planB,
  spegeln,
  panora,
  medley,
  malmoArena,
  hypnos,
  ticksterMalmo,
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

/**
 * Whether a source is on when the admin hasn't chosen. In live mode,
 * sources that only have demo fixtures stay off so made-up events never
 * mix with real ones; the admin can still switch them on.
 */
export function isEnabledByDefault(source: Pick<EventSource, "demo">) {
  return !(LIVE_MODE && source.demo);
}

export function getSource(id: string) {
  return SOURCES.find((s) => s.id === id);
}

export type SourceMeta = (typeof SOURCE_META)[number];
