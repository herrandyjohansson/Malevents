import { addDays } from "@/lib/days";
import { DEFAULT_DURATION_MS } from "@/lib/events/filters";
import { localDay } from "@/lib/events/malmo-time";

/** Build an iCalendar file (RFC 5545) so saved events can go into any calendar app. */
export interface IcsEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  /** No known start time: written as an all-day event on its Malmö day. */
  allDay?: boolean;
  location?: string;
  url: string;
}

/** DTSTART and DTEND lines: timed in UTC, or whole Malmö days for all-day events. */
function times(e: IcsEvent) {
  if (e.allDay && !e.endsAt) {
    const day = localDay(new Date(e.startsAt));
    const compact = (d: string) => d.replace(/-/g, "");
    return [`DTSTART;VALUE=DATE:${compact(day)}`, `DTEND;VALUE=DATE:${compact(addDays(day, 1))}`];
  }
  const start = new Date(e.startsAt);
  const end = e.endsAt ? new Date(e.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  return [`DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`];
}

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** TEXT value (RFC 5545 3.3.11). Any line break, CR included, becomes "\n" so it can't start a new property. */
function escape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** URI value: not escaped like TEXT, but control characters must not reach the file. */
function uri(url: string) {
  return url.replace(/[\u0000-\u001f\u007f]/g, "");
}

/** Lines may be at most 75 octets; longer ones continue on lines starting with a space. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (new TextEncoder().encode(rest).length > 75) {
    let cut = 74;
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 74) cut--;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(events: IcsEvent[], now = new Date()) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MOEVENTS//Saved events//EN", "CALSCALE:GREGORIAN"];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escape(e.id)}@malevents`,
      `DTSTAMP:${stamp(now)}`,
      ...times(e),
      `SUMMARY:${escape(e.title)}`,
      ...(e.location ? [`LOCATION:${escape(e.location)}`] : []),
      `URL:${uri(e.url)}`,
      `DESCRIPTION:${escape(e.url)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Hand the file to the browser as a download. */
export function downloadIcs(events: IcsEvent[], filename: string) {
  const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
