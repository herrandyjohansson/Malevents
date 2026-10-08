import { TIME_ZONE } from "./config";
import type { EventCategory, MalmoEvent } from "./types";

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  music: "Music",
  theatre: "Theatre & comedy",
  art: "Art & exhibitions",
  film: "Film",
  family: "Family",
  sports: "Sports",
  food: "Food & markets",
  talks: "Talks & workshops",
  other: "Other",
};

/** Category accent colours, used for card accents, legend dots and map markers. */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  music: "#c084fc",
  theatre: "#fb7185",
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
  art: "🎨",
  film: "🎬",
  family: "🧸",
  sports: "⚽",
  food: "🍽️",
  talks: "🎤",
  other: "📍",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

export function formatEventDate(event: MalmoEvent) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : undefined;
  const startDay = dateFormat.format(start);
  if (end && dateFormat.format(end) !== startDay) {
    return `${startDay} – ${dateFormat.format(end)}`;
  }
  return `${startDay} · ${timeFormat.format(start)}${end ? `–${timeFormat.format(end)}` : ""}`;
}

export function formatPrice(event: MalmoEvent) {
  if (event.isFree) return "Free";
  if (!event.price) return undefined;
  const { min, max, currency } = event.price;
  const unit = currency === "SEK" ? "kr" : currency;
  if (min !== undefined && max !== undefined && min !== max) return `${min}–${max} ${unit}`;
  return `${min ?? max} ${unit}`;
}

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** Pieces for a calendar-style date tile. */
export function dateParts(iso: string) {
  const parts = partsFormat.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: get("weekday"), day: get("day"), month: get("month") };
}

export function formatTime(iso: string) {
  return timeFormat.format(new Date(iso));
}

/** Long label for a yyyy-mm-dd Malmö day, e.g. "Friday 9 October". */
export function formatDayLabel(day: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${day}T00:00:00Z`));
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelative(iso: string, now: Date) {
  const seconds = Math.round((Date.parse(iso) - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return relative.format(seconds, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86400), "day");
}
