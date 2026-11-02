import { eventIdentities, metresBetween as distance } from "./dedupe";
import { localDay } from "./malmo-time";
import type { MalmoEvent } from "./types";
import { venueSlug } from "./venues";

export interface DuplicatePair {
  a: string;
  b: string;
  reason: "same-title" | "similar-title";
  minutesApart: number;
  crossSource: boolean;
}

/*
 * Thresholds for the audit. It only reports candidates for a person to review
 * (dedupe.ts does the actual merging), so they lean towards reporting too much.
 */
/** Shortest venue name taken as the start of another ("Slagthuset" in "Slagthuset Teater"); shorter ones match too much. */
const MIN_VENUE_PREFIX = 6;
/** Two listings this close are at the same place even under different venue names (neighbouring entrances, rooms). */
const SAME_PLACE_METRES = 100;
/** Two venue names this close are reported as possibly one venue under two names. */
const SAME_VENUE_METRES = 50;
/** Listings further apart than this are different performances, however alike (matinée and evening show). */
const MAX_MINUTES_APART = 120;
/** "Similar" titles share at least this many words, and this share of all their words. */
const MIN_SHARED_WORDS = 2;
const MIN_WORD_OVERLAP = 0.6;

/** A title or name for comparing: lower case, no accents, punctuation turned into single spaces. */
export function auditTitle(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/** Whether one venue name is the other plus more words ("Slagthuset" / "Slagthusets Teater"): likely the same building. */
function relatedVenueNames(a: string, b: string) {
  const names = [auditTitle(a), auditTitle(b)].sort((left, right) => left.length - right.length);
  const [short, long] = names;
  return short.length >= MIN_VENUE_PREFIX && (long.startsWith(`${short} `) || long.startsWith(`${short}s `));
}

/** Same venue by slug, by coordinates or by name prefix. */
function samePlace(a: MalmoEvent, b: MalmoEvent) {
  if (!a.venue || !b.venue) return false;
  return venueSlug(a.venue.name) === venueSlug(b.venue.name) ||
    distance(a.venue, b.venue) <= SAME_PLACE_METRES || relatedVenueNames(a.venue.name, b.venue.name);
}

/**
 * Word overlap of two audit titles (Jaccard): catches the same show listed as
 * "Kent – Tribute" and "Kent tribute night" without matching every pair of
 * titles that share one common word.
 */
function similarTitle(a: string, b: string) {
  const left = new Set(a.split(" "));
  const right = new Set(b.split(" "));
  const shared = [...left].filter((word) => right.has(word)).length;
  return shared >= MIN_SHARED_WORDS && shared / new Set([...left, ...right]).size >= MIN_WORD_OVERLAP;
}

/** Ids of events that share a key, one list per key that occurs more than once. */
function repeatedKeys(events: MalmoEvent[], key: (event: MalmoEvent) => string) {
  const groups = new Map<string, MalmoEvent[]>();
  for (const event of events) {
    const value = key(event);
    groups.set(value, [...(groups.get(value) ?? []), event]);
  }
  return [...groups.values()].filter((group) => group.length > 1).map((group) => group.map((event) => event.id));
}

/**
 * Join pairs into groups (connected components): if A links to B and B to C,
 * all three are one event, even though A and C were never compared directly.
 */
function linkedGroups(pairs: { a: string; b: string }[]) {
  const neighbours = new Map<string, Set<string>>();
  for (const { a, b } of pairs) {
    for (const [from, to] of [[a, b], [b, a]]) {
      if (!neighbours.has(from)) neighbours.set(from, new Set());
      neighbours.get(from)!.add(to);
    }
  }
  const visited = new Set<string>();
  const groups: string[][] = [];
  for (const start of neighbours.keys()) {
    if (visited.has(start)) continue;
    const pending = [start];
    const group: string[] = [];
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      group.push(id);
      pending.push(...neighbours.get(id)!);
    }
    groups.push(group);
  }
  return groups;
}

/**
 * Diagnostic candidates only: shared buildings and repeated performances
 * require human review. Compares every pair of events on the same day (pairs
 * from different sources are also checked for a shared ticket or event link),
 * then every pair of venue names.
 */
export function auditDuplicates(events: MalmoEvent[]) {
  const exactIds = repeatedKeys(events, (event) => event.id);
  const titleMinute = repeatedKeys(events, (event) =>
    `${auditTitle(event.title).replaceAll(" ", "")}|${new Date(event.startsAt).toISOString().slice(0, 16)}`);
  const byDay = new Map<string, MalmoEvent[]>();
  for (const event of events) {
    const day = localDay(new Date(event.startsAt));
    byDay.set(day, [...(byDay.get(day) ?? []), event]);
  }
  const pairs: DuplicatePair[] = [];
  const sharedLinkPairs: { a: string; b: string; identity: string; minutesApart: number }[] = [];
  for (const day of byDay.values()) {
    for (let i = 0; i < day.length; i++) {
      for (let j = i + 1; j < day.length; j++) {
        const a = day[i];
        const b = day[j];
        const minutesApart = Math.abs(Date.parse(a.startsAt) - Date.parse(b.startsAt)) / 60_000;
        if (a.id === b.id || minutesApart > MAX_MINUTES_APART) continue;
        if (a.sourceId !== b.sourceId) {
          const links = eventIdentities(b);
          const identity = eventIdentities(a).find((link) => links.includes(link));
          if (identity) sharedLinkPairs.push({ a: a.id, b: b.id, identity, minutesApart });
        }
        if (!samePlace(a, b)) continue;
        const left = auditTitle(a.title);
        const right = auditTitle(b.title);
        const same = left.replaceAll(" ", "") === right.replaceAll(" ", "");
        if (!same && !similarTitle(left, right)) continue;
        pairs.push({
          a: a.id, b: b.id, reason: same ? "same-title" : "similar-title",
          minutesApart, crossSource: a.sourceId !== b.sourceId,
        });
      }
    }
  }

  const venues = new Map<string, { name: string; count: number; location: NonNullable<MalmoEvent["venue"]> }>();
  for (const event of events) {
    if (!event.venue) continue;
    const slug = venueSlug(event.venue.name);
    if (!slug) continue;
    const existing = venues.get(slug);
    if (existing) existing.count++;
    else venues.set(slug, { name: event.venue.name, count: 1, location: event.venue });
  }
  const entries = [...venues.entries()];
  const venuePairs: {
    a: string; b: string; metresApart: number | null; eventsA: number; eventsB: number;
    reason: "nearby-coordinates" | "name-prefix";
  }[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [, a] = entries[i];
      const [, b] = entries[j];
      const metres = distance(a.location, b.location);
      if (metres <= SAME_VENUE_METRES || relatedVenueNames(a.name, b.name)) venuePairs.push({
        a: a.name, b: b.name, metresApart: Number.isFinite(metres) ? Math.round(metres) : null,
        eventsA: a.count, eventsB: b.count,
        reason: metres <= SAME_VENUE_METRES ? "nearby-coordinates" : "name-prefix",
      });
    }
  }
  const identityGroups = linkedGroups(sharedLinkPairs);
  return {
    events: events.length,
    venues: venues.size,
    exactIds,
    titleMinute,
    pairs,
    sharedLinkPairs,
    identityGroups,
    identitySupportedSurplus: identityGroups.reduce((count, group) => count + group.length - 1, 0),
    candidateEventIds: [...new Set(pairs.flatMap((pair) => [pair.a, pair.b]))],
    venuePairs,
  };
}
