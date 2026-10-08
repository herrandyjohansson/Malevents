import { TIME_ZONE } from "./config";
import { EVENT_CATEGORIES, type EventCategory, type MalmoEvent } from "./types";

export const WHEN_OPTIONS = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "Next 7 days" },
  { value: "month", label: "Next 30 days" },
] as const;

export type When = (typeof WHEN_OPTIONS)[number]["value"];

export interface EventFilters {
  q: string;
  category: EventCategory | "all";
  source: string;
  when: When;
  free: boolean;
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse untrusted search params into a valid filter set. */
export function parseFilters(params: SearchParams): EventFilters {
  const category = first(params.category);
  const when = first(params.when);
  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    category: (EVENT_CATEGORIES as readonly string[]).includes(category ?? "")
      ? (category as EventCategory)
      : "all",
    source: first(params.source) || "all",
    when: WHEN_OPTIONS.some((o) => o.value === when) ? (when as When) : "all",
    free: first(params.free) === "1",
  };
}

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const weekdayFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short" });

/** yyyy-mm-dd in Malmö local time. */
export function localDay(date: Date) {
  return dayFormat.format(date);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

function dayRange(when: When, now: Date): [string, string] | null {
  const today = localDay(now);
  switch (when) {
    case "today":
      return [today, today];
    case "week":
      return [today, localDay(addDays(now, 6))];
    case "month":
      return [today, localDay(addDays(now, 29))];
    case "weekend": {
      const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekdayFormat.format(now));
      const saturday = addDays(now, 5 - weekday);
      return [weekday === 6 ? today : localDay(saturday), localDay(addDays(saturday, 1))];
    }
    default:
      return null;
  }
}

const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

export function applyFilters(events: MalmoEvent[], filters: EventFilters, now: Date): MalmoEvent[] {
  const range = dayRange(filters.when, now);
  const q = filters.q.toLowerCase();

  return events.filter((e) => {
    if (!isUpcoming(e, now)) return false;
    const start = new Date(e.startsAt);
    const end = e.endsAt ? new Date(e.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);
    if (filters.category !== "all" && e.category !== filters.category) return false;
    if (filters.source !== "all" && e.sourceId !== filters.source) return false;
    if (filters.free && !e.isFree) return false;
    if (range) {
      // An event matches a day window if it overlaps it (multi-day exhibitions count).
      const [from, to] = range;
      if (localDay(start) > to || localDay(end) < from) return false;
    }
    if (q) {
      const text = `${e.title} ${e.description ?? ""} ${e.venue?.name ?? ""}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

/** True if the event hasn't finished yet. */
export function isUpcoming(event: MalmoEvent, now: Date) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  return end >= now;
}
