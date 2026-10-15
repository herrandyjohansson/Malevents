import { TIME_ZONE } from "./config";

/**
 * Malmö wall-clock time. Client-safe: the filters use it in the browser,
 * the adapters on the server.
 */

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** yyyy-mm-dd in Malmö local time. */
export function localDay(date: Date) {
  return dayFormat.format(date);
}

/** HH:MM in Malmö local time. */
export function localTime(date: Date) {
  return clockFormat.format(date);
}

/** Today's date in Malmö as YYYY-MM-DD. */
export function malmoToday(): string {
  return localDay(new Date());
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
