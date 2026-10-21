import { dayNames, formatDay, formatShort } from "@/lib/days";

import { localDay, localTime } from "./malmo-time";
import type { EventCategory, MalmoEvent } from "./types";

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: "Music",
  theatre: "Stage",
  nightlife: "Nightlife",
  art: "Art & exhibitions",
  film: "Film",
  family: "Family",
  sports: "Sports",
  food: "Food & drink",
  talks: "Talks & workshops",
  other: "Other",
};

/** Category accent colours, used for card accents, legend dots and map markers. */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  music: "#c084fc",
  theatre: "#fb7185",
  nightlife: "#2dd4bf",
  art: "#fbbf24",
  film: "#94a3b8",
  family: "#38bdf8",
  sports: "#4ade80",
  food: "#fb923c",
  talks: "#818cf8",
  other: "#a1a1aa",
};

/** Glyph shown inside map pins and the map legend. */
export const CATEGORY_EMOJI: Record<EventCategory, string> = {
  music: "🎵",
  theatre: "🎭",
  nightlife: "🪩",
  art: "🎨",
  film: "🎬",
  family: "🧸",
  sports: "⚽",
  food: "🍽️",
  talks: "🎤",
  other: "📍",
};

// Labels are built by hand from Malmö day and clock strings rather than with
// Intl's text formats, so server and browser always render the same text
// (see lib/days.ts). That keeps these helpers safe in client components too.

/** "Fri 9 Oct · 19:00", "Fri 9 Oct · 19:00–21:00", "Fri 9 Oct – Sun 11 Oct", or "Fri 9 Oct" without a known time. */
export function formatEventDate(event: Pick<MalmoEvent, "startsAt" | "endsAt" | "timeUnknown">) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : undefined;
  const startDay = formatShort(localDay(start));
  if (end && localDay(end) !== localDay(start)) {
    return `${startDay} – ${formatShort(localDay(end))}`;
  }
  if (event.timeUnknown) return startDay;
  return `${startDay} · ${localTime(start)}${end ? `–${localTime(end)}` : ""}`;
}

/** "Wednesday 21 October · 19:30", a day range for multi-day events, or the day alone when the time is unknown. */
export function formatEventDateLong(event: Pick<MalmoEvent, "startsAt" | "endsAt" | "timeUnknown">) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : undefined;
  const startDay = formatDay(localDay(start));
  if (end && localDay(end) !== localDay(start)) return `${startDay} – ${formatDay(localDay(end))}`;
  if (event.timeUnknown) return startDay;
  return `${startDay} · ${localTime(start)}${end ? `–${localTime(end)}` : ""}`;
}

export function formatPrice(event: MalmoEvent) {
  if (event.isFree) return "Free";
  if (!event.price) return undefined;
  const { min, max, currency } = event.price;
  const unit = currency === "SEK" ? "kr" : currency;
  if (min !== undefined && max !== undefined && min !== max) return `${min}–${max} ${unit}`;
  return `${min ?? max} ${unit}`;
}

/** Pieces for a calendar-style date tile: "Fri", "9", "Oct". */
export function dateParts(iso: string) {
  const names = dayNames(localDay(new Date(iso)));
  return { weekday: names.weekday.slice(0, 3), day: String(names.day), month: names.month.slice(0, 3) };
}

/** "19:00" in Malmö time, or "TBA" when the upstream gave no start time. */
export function formatStartTime(event: Pick<MalmoEvent, "startsAt" | "timeUnknown">) {
  return event.timeUnknown ? "TBA" : localTime(new Date(event.startsAt));
}

const UNITS = [
  { unit: "second", seconds: 1, below: 60 },
  { unit: "minute", seconds: 60, below: 3600 },
  { unit: "hour", seconds: 3600, below: 86400 },
  { unit: "day", seconds: 86400, below: Infinity },
] as const;

/** "now", "in 5 minutes", "2 hours ago", "yesterday", "tomorrow" … */
export function formatRelative(iso: string, now: Date) {
  const seconds = Math.round((Date.parse(iso) - now.getTime()) / 1000);
  const { unit, seconds: size } = UNITS.find((u) => Math.abs(seconds) < u.below)!;
  const n = Math.round(seconds / size);
  if (n === 0) return unit === "second" ? "now" : unit === "day" ? "today" : `this ${unit}`;
  if (unit === "day" && Math.abs(n) === 1) return n > 0 ? "tomorrow" : "yesterday";
  const label = `${Math.abs(n)} ${unit}${Math.abs(n) === 1 ? "" : "s"}`;
  return n > 0 ? `in ${label}` : `${label} ago`;
}
