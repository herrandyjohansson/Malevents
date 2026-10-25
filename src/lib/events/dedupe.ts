import type { MalmoEvent } from "./types";

/**
 * Listings that share a booking or event page and start this close together
 * are one occurrence. Wider gaps are separate performances (a matinee and an
 * evening show often share one booking page), or a source with wrong times,
 * which is better fixed in its adapter than hidden here.
 */
const SAME_OCCURRENCE_MS = 15 * 60_000;
/** Same-title listings whose venues are farther apart than this are different events. */
const SAME_PLACE_METRES = 500;
const TRACKING_PARAM = /^(utm_.*|fbclid|gclid|mc_[a-z]+)$/i;
/** Tickster booking ids, as in tickster.com/se/sv/events/{id}/… and secure.tickster.com/sv/{id}. */
const TICKSTER_ID = /^[a-z0-9]{15}$/;

/**
 * What identifies the occurrence behind a listing across sources: its
 * Tickster booking id, or its event page with `www`, a trailing slash and
 * tracking parameters removed. Home pages say nothing about the event and
 * are left out.
 */
export function eventIdentities(event: Pick<MalmoEvent, "url" | "ticketUrl">): string[] {
  const keys = new Set<string>();
  for (const link of [event.url, event.ticketUrl]) {
    if (!link) continue;
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      continue;
    }
    if (url.hostname === "tickster.com" || url.hostname.endsWith(".tickster.com")) {
      const id = url.pathname.split("/").find((part) => TICKSTER_ID.test(part));
      if (id) {
        keys.add(`tickster:${id}`);
        continue;
      }
    }
    const path = url.pathname.replace(/\/+$/, "");
    if (!path) continue;
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    keys.add(`${url.hostname.replace(/^www\./, "")}${path}${url.search}`);
  }
  return [...keys];
}

export function metresBetween(a: NonNullable<MalmoEvent["venue"]>, b: NonNullable<MalmoEvent["venue"]>) {
  if (a.lat === undefined || a.lng === undefined || b.lat === undefined || b.lng === undefined) return Infinity;
  const radians = Math.PI / 180;
  const x = (a.lng - b.lng) * radians * Math.cos(((a.lat + b.lat) / 2) * radians);
  const y = (a.lat - b.lat) * radians;
  return Math.hypot(x, y) * 6_371_000;
}

function titleKey(title: string) {
  return title.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "");
}

/** Only a known distance can tell venues apart; a venue without coordinates conflicts with nothing. */
function farApart(a: MalmoEvent, b: MalmoEvent) {
  if (!a.venue || !b.venue) return false;
  const metres = metresBetween(a.venue, b.venue);
  return Number.isFinite(metres) && metres > SAME_PLACE_METRES;
}

/** How many fields a record has filled in; of two equally ranked listings, the richer one is kept. */
function filledFieldCount(event: MalmoEvent) {
  return Object.values(event).filter((v) => v !== undefined && v !== "").length;
}

function compareText(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The kept record with gaps filled from the other listings, most preferred
 * first. Facts the kept record already has win, and status flags (sold
 * out, cancelled) are not copied: they stay with the listing that set them.
 */
function combine(primary: MalmoEvent, others: MalmoEvent[]): MalmoEvent {
  const merged = { ...primary };
  for (const other of others) {
    if (!merged.description) merged.description = other.description;
    merged.imageUrl ??= other.imageUrl;
    merged.ticketUrl ??= other.ticketUrl;
    if (!merged.price && !merged.isFree) merged.price = other.price;
    if (!merged.endsAt && other.endsAt && Date.parse(other.startsAt) === Date.parse(merged.startsAt)) {
      merged.endsAt = other.endsAt;
    }
    if (merged.category === "other") merged.category = other.category;
    if (!merged.venue) {
      merged.venue = other.venue;
    } else if (other.venue) {
      const venue = { ...merged.venue };
      if ((venue.lat === undefined || venue.lng === undefined) && other.venue.lat !== undefined && other.venue.lng !== undefined) {
        venue.lat = other.venue.lat;
        venue.lng = other.venue.lng;
      }
      venue.address ??= other.venue.address;
      merged.venue = venue;
    }
  }
  const ids = new Set([primary, ...others].flatMap((e) => [e.id, ...(e.duplicateIds ?? [])]));
  ids.delete(primary.id);
  if (ids.size > 0) merged.duplicateIds = [...ids].sort(compareText);
  return merged;
}

/**
 * Merge listings of the same occurrence, from different sources or repeated
 * in one feed. Two listings are one occurrence when they have
 *
 * - the same title (ignoring case, accents and punctuation) and start minute, or
 * - a shared Tickster booking id or event page, come from different
 *   sources, and start within SAME_OCCURRENCE_MS of each other,
 *
 * and their venues aren't far apart. A group never spans more than
 * SAME_OCCURRENCE_MS, and never holds two different start times from one
 * source, so listings can't be chained into one group through a third.
 *
 * The record of the best-ranked source (lowest `rank`, a venue's own
 * source before aggregators) is kept; the others fill its gaps and their
 * ids are kept in `duplicateIds`. The result doesn't depend on input order.
 */
export function mergeDuplicates(events: MalmoEvent[], rank: (sourceId: string) => number): MalmoEvent[] {
  const sorted = [...events].sort(
    (a, b) =>
      rank(a.sourceId) - rank(b.sourceId) ||
      filledFieldCount(b) - filledFieldCount(a) ||
      compareText(a.id, b.id) ||
      compareText(JSON.stringify(a), JSON.stringify(b)),
  );
  const starts = sorted.map((e) => Date.parse(e.startsAt));
  const parent = sorted.map((_, i) => i);
  const members = sorted.map((_, i) => [i]);
  const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i])));

  function join(i: number, j: number) {
    const a = root(i);
    const b = root(j);
    if (a === b) return;
    const all = [...members[a], ...members[b]];
    const times = all.map((k) => starts[k]);
    if (Math.max(...times) - Math.min(...times) > SAME_OCCURRENCE_MS) return;
    const startBySource = new Map<string, number>();
    for (const k of all) {
      const known = startBySource.get(sorted[k].sourceId);
      if (known !== undefined && known !== starts[k]) return;
      startBySource.set(sorted[k].sourceId, starts[k]);
    }
    if (members[a].some((x) => members[b].some((y) => farApart(sorted[x], sorted[y])))) return;
    const [keep, drop] = a < b ? [a, b] : [b, a];
    parent[drop] = keep;
    members[keep] = all;
    members[drop] = [];
  }

  const byTitle = new Map<string, number[]>();
  const byIdentity = new Map<string, number[]>();
  sorted.forEach((event, i) => {
    const key = `${titleKey(event.title)}|${new Date(starts[i]).toISOString().slice(0, 16)}`;
    byTitle.set(key, [...(byTitle.get(key) ?? []), i]);
    for (const identity of eventIdentities(event)) byIdentity.set(identity, [...(byIdentity.get(identity) ?? []), i]);
  });

  for (const group of byTitle.values()) {
    for (let k = 1; k < group.length; k++) for (let j = 0; j < k; j++) join(group[j], group[k]);
  }

  const edges: { i: number; j: number; gap: number }[] = [];
  for (const group of byIdentity.values()) {
    for (let k = 1; k < group.length; k++) {
      for (let j = 0; j < k; j++) {
        const [i, m] = [group[j], group[k]];
        const gap = Math.abs(starts[i] - starts[m]);
        if (sorted[i].sourceId !== sorted[m].sourceId && gap <= SAME_OCCURRENCE_MS) edges.push({ i, j: m, gap });
      }
    }
  }
  edges.sort((a, b) => a.gap - b.gap || a.i - b.i || a.j - b.j);
  for (const { i, j } of edges) join(i, j);

  return sorted
    .map((_, i) => (root(i) === i ? [...members[i]].sort((x, y) => x - y) : undefined))
    .filter((group): group is number[] => group !== undefined)
    .map(([first, ...rest]) => combine(sorted[first], rest.map((k) => sorted[k])))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt) || compareText(a.id, b.id));
}
