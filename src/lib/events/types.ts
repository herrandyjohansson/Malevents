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
  };
  price?: {
    min?: number;
    max?: number;
    currency: string;
  };
  isFree: boolean;
  imageUrl?: string;
  url: string;
}

/**
 * One adapter per upstream API. `fetchEvents` should do its own caching
 * (`"use cache"` + `cacheLife` + `cacheTag`) and may throw; the aggregator
 * isolates failures so one broken source never breaks the page.
 */
export interface EventSource {
  id: string;
  name: string;
  homepage: string;
  /** True while the adapter serves fixture data instead of a live API. */
  demo?: boolean;
  /** Per-source budget before the aggregator gives up on it. */
  timeoutMs?: number;
  fetchEvents: () => Promise<MalmoEvent[]>;
}

export type SourceStatus =
  | { id: string; name: string; demo: boolean; ok: true; count: number }
  | { id: string; name: string; demo: boolean; ok: false; error: string };
