import { TIME_ZONE } from "./config";

/**
 * ISO timestamp for `dayOffset` days from today at `time` (HH:mm) Malmö
 * local time. Demo fixtures use this so they always look upcoming.
 */
export function malmoTime(dayOffset: number, time: string): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + dayOffset));
  const ymd = date.toISOString().slice(0, 10);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "longOffset" })
    .formatToParts(new Date(`${ymd}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")!
    .value.replace("GMT", "");
  return `${ymd}T${time}:00${offset || "+00:00"}`;
}
