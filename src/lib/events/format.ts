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

/** Tailwind gradient used as the card header when an event has no image. */
export const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  music: "from-violet-500 to-fuchsia-500",
  theatre: "from-rose-500 to-orange-400",
  art: "from-amber-400 to-yellow-300",
  film: "from-slate-700 to-slate-500",
  family: "from-sky-400 to-cyan-300",
  sports: "from-emerald-500 to-lime-400",
  food: "from-orange-500 to-amber-400",
  talks: "from-indigo-500 to-blue-400",
  other: "from-zinc-500 to-zinc-400",
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
