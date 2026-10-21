import { addDays, formatDay } from "@/lib/days";

import { toFilterable } from "./filters";
import type { MalmoEvent } from "./types";

export interface DayGroup {
  /** yyyy-mm-dd in Malmö. */
  day: string;
  /** "Today", "Tomorrow" or "Friday 23 October". */
  label: string;
  /** The full date under "Today" and "Tomorrow"; empty otherwise. */
  date: string;
  events: MalmoEvent[];
}

/**
 * Upcoming events under day headings, earliest first. An event already
 * running (an exhibition that opened last week) sits under today, not under
 * the day it began.
 */
export function groupByDay(events: MalmoEvent[], today: string): DayGroup[] {
  const tomorrow = addDays(today, 1);
  const groups = new Map<string, MalmoEvent[]>();
  for (const event of events) {
    const { startDay } = toFilterable(event);
    const day = startDay < today ? today : startDay;
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, list]) => ({
      day,
      label: day === today ? "Today" : day === tomorrow ? "Tomorrow" : formatDay(day),
      date: day === today || day === tomorrow ? formatDay(day) : "",
      events: list,
    }));
}

/** The first `limit` events, keeping whole day headings for the days that are cut. */
export function takeEvents(groups: DayGroup[], limit: number): DayGroup[] {
  const out: DayGroup[] = [];
  let left = limit;
  for (const group of groups) {
    if (left <= 0) break;
    out.push({ ...group, events: group.events.slice(0, left) });
    left -= group.events.length;
  }
  return out;
}
