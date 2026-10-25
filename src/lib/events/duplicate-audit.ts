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

export function auditTitle(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function relatedVenueNames(a: string, b: string) {
  const names = [auditTitle(a), auditTitle(b)].sort((left, right) => left.length - right.length);
  const [short, long] = names;
  return short.length >= 6 && (long.startsWith(`${short} `) || long.startsWith(`${short}s `));
}

function samePlace(a: MalmoEvent, b: MalmoEvent) {
  if (!a.venue || !b.venue) return false;
  return venueSlug(a.venue.name) === venueSlug(b.venue.name) ||
    distance(a.venue, b.venue) <= 100 || relatedVenueNames(a.venue.name, b.venue.name);
}

function similarTitle(a: string, b: string) {
  const left = new Set(a.split(" "));
  const right = new Set(b.split(" "));
  const shared = [...left].filter((word) => right.has(word)).length;
  return shared >= 2 && shared / new Set([...left, ...right]).size >= 0.6;
}

function repeatedKeys(events: MalmoEvent[], key: (event: MalmoEvent) => string) {
  const groups = new Map<string, MalmoEvent[]>();
  for (const event of events) {
    const value = key(event);
    groups.set(value, [...(groups.get(value) ?? []), event]);
  }
  return [...groups.values()].filter((group) => group.length > 1).map((group) => group.map((event) => event.id));
}

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

/** Diagnostic candidates only: shared buildings and repeated performances require human review. */
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
        if (a.id === b.id || minutesApart > 120) continue;
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
      if (metres <= 50 || relatedVenueNames(a.name, b.name)) venuePairs.push({
        a: a.name, b: b.name, metresApart: Number.isFinite(metres) ? Math.round(metres) : null,
        eventsA: a.count, eventsB: b.count,
        reason: metres <= 50 ? "nearby-coordinates" : "name-prefix",
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
