import { addDays } from "@/lib/days";

import { endOf, isLongRunning, NIGHT_ENDS, toFilterable } from "./filters";
import { localDay } from "./malmo-time";
import type { MalmoEvent } from "./types";

export interface TonightGroups {
  /** Started and not over yet. */
  live: MalmoEvent[];
  /** Still to start tonight (including today's events without a known time). */
  later: MalmoEvent[];
  /** Exhibitions and other long-running events open today. */
  allDay: MalmoEvent[];
  /** Starting tomorrow, shown once nothing else starts tonight. */
  tomorrow: MalmoEvent[];
}

/** Timed events by start; those without a known time last, as they could be any time that day. */
function byStart(a: MalmoEvent, b: MalmoEvent) {
  return Number(a.timeUnknown ?? false) - Number(b.timeUnknown ?? false) || a.startsAt.localeCompare(b.startsAt);
}

/**
 * Sort events into the Tonight tab's sections. Tonight here means the rest
 * of today's Malmö date plus shows starting before NIGHT_ENDS tomorrow (see
 * filters.ts for how that differs from the `when=tonight` filter).
 */
export function groupTonight(events: MalmoEvent[], now: Date): TonightGroups {
  const today = localDay(now);
  const tomorrow = addDays(today, 1);
  const groups: TonightGroups = { live: [], later: [], allDay: [], tomorrow: [] };

  for (const event of events) {
    if (endOf(event) < now) continue;
    const { startDay, endDay, startTime } = toFilterable(event);
    if (isLongRunning({ startDay, endDay })) {
      if (startDay <= today && endDay >= today) groups.allDay.push(event);
      continue;
    }
    const isAfterMidnightShow = startDay === tomorrow && !event.timeUnknown && startTime < NIGHT_ENDS;
    const startsTonight = startDay === today || isAfterMidnightShow;
    const hasStarted = !event.timeUnknown && new Date(event.startsAt) <= now;
    if (startsTonight && hasStarted) groups.live.push(event);
    else if (startsTonight) groups.later.push(event);
    else if (startDay === tomorrow) groups.tomorrow.push(event);
  }

  groups.live.sort(byStart);
  groups.later.sort(byStart);
  groups.tomorrow.sort(byStart);
  return groups;
}
