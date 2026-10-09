import "server-only";

import type { MapEvent } from "@/components/map/types";

import { isUpcoming, localDay } from "./filters";
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  formatEventDate,
  formatPrice,
} from "./format";
import type { MalmoEvent, SourceStatus } from "./types";
import { hasCoordinates } from "./venues";

const DAY_MS = 86_400_000;

function overlaps(e: MalmoEvent, from: string, to: string) {
  const start = localDay(new Date(e.startsAt));
  const end = e.endsAt ? localDay(new Date(e.endsAt)) : start;
  return start <= to && end >= from;
}

function toMapEvent(e: MalmoEvent, sourceNames: Map<string, string>): MapEvent {
  const startDay = localDay(new Date(e.startsAt));
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    categoryLabel: CATEGORY_LABELS[e.category],
    color: CATEGORY_COLORS[e.category],
    emoji: CATEGORY_EMOJI[e.category],
    venueName: e.venue!.name,
    lat: e.venue!.lat!,
    lng: e.venue!.lng!,
    startDay,
    endDay: e.endsAt ? localDay(new Date(e.endsAt)) : startDay,
    timeLabel: formatEventDate(e),
    priceLabel: formatPrice(e),
    url: e.url,
    sourceName: sourceNames.get(e.sourceId) ?? e.sourceId,
  };
}

/** Upcoming, placeable events in the next `days` days (today included). */
export function weekMapEvents(events: MalmoEvent[], sources: SourceStatus[], now: Date, days = 7) {
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  const from = localDay(now);
  const to = localDay(new Date(now.getTime() + (days - 1) * DAY_MS));
  return events
    .filter((e) => isUpcoming(e, now) && hasCoordinates(e) && overlaps(e, from, to))
    .map((e) => toMapEvent(e, sourceNames));
}

/** Upcoming, placeable events, each tagged with the Malmö days it spans. */
export function buildMapEvents(events: MalmoEvent[], sources: SourceStatus[], now: Date): MapEvent[] {
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  return events
    .filter((e) => isUpcoming(e, now) && hasCoordinates(e))
    .map((e) => toMapEvent(e, sourceNames));
}
