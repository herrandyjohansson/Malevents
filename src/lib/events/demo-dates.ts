import { malmoLocalToIso, malmoToday } from "./malmo-time";

/**
 * ISO timestamp for `dayOffset` days from today at `time` (HH:mm) Malmö
 * local time. Demo fixtures use this so they always look upcoming.
 */
export function daysFromTodayAt(dayOffset: number, time: string): string {
  const [y, m, d] = malmoToday().split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + dayOffset));
  return malmoLocalToIso(date.toISOString().slice(0, 10), time);
}
