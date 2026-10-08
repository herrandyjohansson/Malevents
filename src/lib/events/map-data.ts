import "server-only";

import type { MapEvent, MapView } from "@/components/map/types";

import { isUpcoming, localDay } from "./filters";
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  dateParts,
  formatDayLabel,
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

/** A "next 7 days" view followed by one view per day for the next `days` days. */
export function buildMapViews(events: MalmoEvent[], sources: SourceStatus[], now: Date, days = 14): MapView[] {
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  const upcoming = events.filter((e) => isUpcoming(e, now) && hasCoordinates(e));

  const week: MapView = {
    key: "week",
    kind: "week",
    label: "Next 7 days",
    top: "Next",
    middle: "7",
    bottom: "days",
    events: weekMapEvents(events, sources, now),
  };

  const dayViews = Array.from({ length: days }, (_, i): MapView => {
    const date = new Date(now.getTime() + i * DAY_MS);
    const day = localDay(date);
    const { weekday, day: dayOfMonth, month } = dateParts(date.toISOString());
    return {
      key: day,
      kind: "day",
      label: formatDayLabel(day),
      top: weekday,
      middle: dayOfMonth,
      bottom: month,
      events: upcoming.filter((e) => overlaps(e, day, day)).map((e) => toMapEvent(e, sourceNames)),
    };
  });

  return [week, ...dayViews];
}
