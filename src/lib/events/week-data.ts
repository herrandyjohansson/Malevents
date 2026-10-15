import "server-only";

import { isUpcoming } from "./filters";
import { localDay } from "./malmo-time";
import type { EventCategory, MalmoEvent } from "./types";

const DAY_MS = 86_400_000;

export interface WeekDay {
  /** yyyy-mm-dd in Malmö local time. */
  day: string;
  /** Events starting this day, earliest first. */
  events: MalmoEvent[];
  /** Event count per category, largest first, for the column's mix bar. */
  mix: { category: EventCategory; count: number }[];
}

/**
 * The next `days` days starting today, each with the events that start on it.
 * Long runs (exhibitions and the like) are left out of the columns so a
 * month-long show doesn't fill every day; `ongoing` counts them instead.
 */
export function buildWeek(events: MalmoEvent[], now: Date, days = 7) {
  const dayKeys = Array.from({ length: days }, (_, i) => localDay(new Date(now.getTime() + i * DAY_MS)));
  const byDay = new Map(dayKeys.map((d) => [d, [] as MalmoEvent[]]));
  let ongoing = 0;

  for (const e of events) {
    if (!isUpcoming(e, now)) continue;
    const start = localDay(new Date(e.startsAt));
    const end = e.endsAt ? localDay(new Date(e.endsAt)) : start;
    if (end > start) {
      if (start <= dayKeys[dayKeys.length - 1]) ongoing++;
      continue;
    }
    byDay.get(start)?.push(e);
  }

  const week: WeekDay[] = dayKeys.map((day) => {
    const list = byDay.get(day)!.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const counts = new Map<EventCategory, number>();
    for (const e of list) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    const mix = [...counts].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
    return { day, events: list, mix };
  });

  return { week, ongoing };
}

/**
 * A handful of picks for the reel: events with a picture, rotating through
 * categories so it isn't all one venue's concerts, soonest first.
 */
export function pickHighlights(week: WeekDay[], limit = 12): MalmoEvent[] {
  const pool = week.flatMap((d) => d.events).filter((e) => e.imageUrl && !e.soldOut);
  const queues = new Map<EventCategory, MalmoEvent[]>();
  for (const e of pool) {
    const q = queues.get(e.category) ?? [];
    q.push(e);
    queues.set(e.category, q);
  }

  const picks: MalmoEvent[] = [];
  const seenTitles = new Set<string>();
  while (picks.length < limit && [...queues.values()].some((q) => q.length)) {
    for (const q of queues.values()) {
      const next = q.shift();
      // Repeat performances share a title; one card per show is enough.
      if (!next || seenTitles.has(next.title)) continue;
      seenTitles.add(next.title);
      picks.push(next);
      if (picks.length === limit) break;
    }
  }
  return picks.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
