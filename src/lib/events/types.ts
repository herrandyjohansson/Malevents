export const EVENT_CATEGORIES = [
  "music",
  "theatre",
  "art",
  "film",
  "family",
  "sports",
  "food",
  "talks",
  "other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/**
 * The normalized event shape every source adapter maps into.
 * Dates are ISO 8601 strings so the value is serializable across
 * `"use cache"` boundaries and the server/client boundary.
 */
export interface MalmoEvent {
  /** Globally unique: `${sourceId}:${sourceEventId}` */
  id: string;
  sourceId: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt?: string;
  category: EventCategory;
  venue?: {
    name: string;
    address?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  price?: {
    min?: number;
    max?: number;
    currency: string;
  };
  isFree: boolean;
  imageUrl?: string;
  url: string;
  /** Direct ticket link, when the upstream gives one apart from the event page. */
  ticketUrl?: string;
  soldOut?: boolean;
  /** Free-text extras from the upstream, e.g. age limit or doors time. */
  notes?: string[];
}

export type CacheProfile = "minutes" | "hours" | "days";

/**
 * One adapter per upstream API. `fetchEvents` fetches and normalizes and may
 * throw. Caching, timeouts and error isolation are applied centrally (see
 * fetch-source.ts and aggregate.ts), so adapters stay small.
 */
export interface EventSource {
  id: string;
  name: string;
  homepage: string;
  /** Short description of the upstream, shown in the admin. */
  description: string;
  /** How the adapter talks to its upstream, shown in the admin. */
  kind: "json-api" | "json-ld" | "html" | "fixture";
  /** The URL the adapter calls in live mode, if any. */
  endpoint?: string;
  /** True while the adapter serves fixture data instead of a live API. */
  demo?: boolean;
  /** How long a successful response is cached. Defaults to "hours". */
  cacheProfile?: CacheProfile;
  /** Per-source budget before the aggregator gives up on it. */
  timeoutMs?: number;
  fetchEvents: () => Promise<MalmoEvent[]>;
}

export interface SourceStatus {
  id: string;
  name: string;
  demo: boolean;
  enabled: boolean;
  state: "ok" | "error" | "disabled";
  count: number;
  error?: string;
  /** When the cached response was fetched from the upstream. */
  fetchedAt?: string;
  /** Time this request spent waiting on the source (cache hits are fast). */
  durationMs?: number;
}
