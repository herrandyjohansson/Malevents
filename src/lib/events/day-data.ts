import "server-only";

import { AREAS, type AreaId } from "./areas";
import { isLongRunning, isUpcoming, matcher, toFilterable, type EventFilters } from "./filters";
import type { EventCategory, MalmoEvent } from "./types";

export interface DayKind {
  category: EventCategory;
  count: number;
}

export interface DayArea {
  /** Null for venues outside every area or without a location. */
  id: AreaId | null;
  name: string;
  events: MalmoEvent[];
}

export interface DayData {
  /** Kinds of event on the day with the other filters applied, busiest first. Long-running events not counted. */
  kinds: DayKind[];
  /** All kinds together, for the "All" chip. */
  total: number;
  /** The picked kinds' events by area, busiest area first, "elsewhere" last. */
  areas: DayArea[];
  /** Exhibitions and other long-running events open that day. */
  allDay: MalmoEvent[];
}

/** Timed events by start; those without a known time last. */
function byStart(a: MalmoEvent, b: MalmoEvent) {
  return Number(a.timeUnknown ?? false) - Number(b.timeUnknown ?? false) || a.startsAt.localeCompare(b.startsAt);
}

/**
 * One day for the day page, reached from the calendar summary. `filters` are
 * the shared filters from the URL; their time window is replaced by the day.
 * On today, events that have already ended are left out.
 */
export function buildDay(events: MalmoEvent[], day: string, filters: EventFilters, today: string, now: Date): DayData {
  const f: EventFilters = { ...filters, when: "custom", from: day, to: day };
  const anyKind = matcher(f, today, { ignore: "cats" });
  const picked = matcher(f, today);
  const counts = new Map<EventCategory, number>();
  const byArea = new Map<AreaId | null, MalmoEvent[]>();
  const allDay: MalmoEvent[] = [];

  for (const event of events) {
    if (day === today && !isUpcoming(event, now)) continue;
    const e = toFilterable(event);
    if (!anyKind(e)) continue;
    const longRunning = isLongRunning(e);
    if (!longRunning) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    if (!picked(e)) continue;
    if (longRunning) allDay.push(event);
    else byArea.set(e.area ?? null, [...(byArea.get(e.area ?? null) ?? []), event]);
  }

  const areas: DayArea[] = [...byArea.entries()]
    .map(([id, list]) => ({
      id,
      name: id ? AREAS.find((a) => a.id === id)!.name : "Elsewhere",
      events: list.sort(byStart),
    }))
    .sort((a, b) => Number(a.id === null) - Number(b.id === null) || b.events.length - a.events.length);

  const kinds = [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return { kinds, total: kinds.reduce((n, k) => n + k.count, 0), areas, allDay: allDay.sort(byStart) };
}
