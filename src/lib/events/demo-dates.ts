import { TIME_ZONE } from "./config";

/**
 * ISO timestamp for `dayOffset` days from today at `time` (HH:mm) Malmö
 * local time. Demo fixtures use this so they always look upcoming.
 */
export function malmoTime(dayOffset: number, time: string): string {
  const [y, m, d] = malmoToday().split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + dayOffset));
  return malmoLocalToIso(date.toISOString().slice(0, 10), time);
}

/**
 * Turn a Malmö wall-clock date (YYYY-MM-DD) and time (HH:mm) into an ISO
 * timestamp with the right UTC offset. Venue feeds give local times
 * without an offset, and the offset changes with daylight saving.
 */
export function malmoLocalToIso(ymd: string, time: string): string {
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(new Date(`${ymd}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")!
    .value.replace("GMT", "");
  return `${ymd}T${time}:00${offset || "+00:00"}`;
}

/** Today's date in Malmö as YYYY-MM-DD. */
export function malmoToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}
