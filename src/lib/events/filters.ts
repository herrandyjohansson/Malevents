import { addDays, isDay, rangeLength, weekend, type DayRange } from "@/lib/days";

import { localDay, localTime } from "./malmo-time";
import { EVENT_CATEGORIES, type EventCategory, type MalmoEvent } from "./types";

/**
 * The one filter model every tab shares. It lives in the URL, so a filter set
 * on Discover is still on when you switch to the Map or the Calendar, and any
 * view can be shared as a link. Client-safe: Map and Calendar filter in the
 * browser, Discover on the server, with the same functions.
 */

export const WHEN_OPTIONS = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "tonight", label: "Tonight" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "Next 7 days" },
  { value: "month", label: "Next 30 days" },
] as const;

export type When = (typeof WHEN_OPTIONS)[number]["value"] | "custom";

export interface EventFilters {
  q: string;
  /** Empty means every category. */
  cats: EventCategory[];
  /** Empty means every source. */
  sources: string[];
  when: When;
  /** Only with when = "custom". */
  from?: string;
  to?: string;
  free: boolean;
  /** Hide exhibitions and other events running for days. */
  hideLong: boolean;
}

export const DEFAULT_FILTERS: EventFilters = {
  q: "",
  cats: [],
  sources: [],
  when: "all",
  free: false,
  hideLong: false,
};

/** Search params owned by the filters; anything else in the URL is left alone. */
export const FILTER_PARAMS = ["q", "cat", "src", "when", "from", "to", "free", "nolong", "category", "source"];

/** "Tonight" means starting from this time, Malmö time. */
const EVENING_FROM = "17:00";
/** Events covering more days than this count as long-running (exhibitions etc.). */
export const LONG_RUNNING_DAYS = 2;

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function get(params: ParamSource, key: string) {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function list(value: string | undefined) {
  return value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];
}

/** Parse untrusted search params into a valid filter set. */
export function parseFilters(params: ParamSource): EventFilters {
  // `category` and `source` are the single-value params older links used.
  const cats = [...list(get(params, "cat")), ...list(get(params, "category"))].filter(
    (c): c is EventCategory => (EVENT_CATEGORIES as readonly string[]).includes(c),
  );
  const sources = [...list(get(params, "src")), ...list(get(params, "source"))].filter((s) => s !== "all");
  const from = get(params, "from");
  const to = get(params, "to");
  const hasRange = isDay(from) && isDay(to) && from <= to;
  let when = (get(params, "when") ?? "") as When;
  if (when === "custom" || (!when && hasRange)) when = hasRange ? "custom" : "all";
  else if (!WHEN_OPTIONS.some((o) => o.value === when)) when = "all";

  return {
    q: (get(params, "q") ?? "").trim().slice(0, 100),
    cats: [...new Set(cats)],
    sources: [...new Set(sources)].slice(0, 30),
    when,
    ...(when === "custom" ? { from, to } : {}),
    free: get(params, "free") === "1",
    hideLong: get(params, "nolong") === "1",
  };
}

/** The filters as search params, leaving out defaults. Other params in `base` are kept. */
export function filtersToParams(filters: EventFilters, base?: URLSearchParams) {
  const params = new URLSearchParams(base);
  for (const key of FILTER_PARAMS) params.delete(key);
  if (filters.q) params.set("q", filters.q);
  if (filters.cats.length) params.set("cat", filters.cats.join(","));
  if (filters.sources.length) params.set("src", filters.sources.join(","));
  if (filters.when === "custom" && filters.from && filters.to) {
    params.set("from", filters.from);
    params.set("to", filters.to);
  } else if (filters.when !== "all" && filters.when !== "custom") {
    params.set("when", filters.when);
  }
  if (filters.free) params.set("free", "1");
  if (filters.hideLong) params.set("nolong", "1");
  return params;
}

/** Just the filter part of a query string, for carrying filters between tabs. */
export function filterQuery(params: URLSearchParams) {
  return filtersToParams(parseFilters(params)).toString();
}

/** How many filters differ from the defaults (search not included). */
export function activeFilterCount(f: EventFilters) {
  return f.cats.length + f.sources.length + Number(f.when !== "all") + Number(f.free) + Number(f.hideLong);
}

export function hasActiveFilters(f: EventFilters) {
  return f.q !== "" || activeFilterCount(f) > 0;
}

/** The days a filter covers, or null for any time. */
export function resolveRange(f: EventFilters, today: string): DayRange | null {
  switch (f.when) {
    case "today":
    case "tonight":
      return { from: today, to: today };
    case "weekend":
      return weekend(today);
    case "week":
      return { from: today, to: addDays(today, 6) };
    case "month":
      return { from: today, to: addDays(today, 29) };
    case "custom":
      if (!f.from || !f.to || f.to < today) return f.from && f.to ? { from: f.from, to: f.to } : null;
      return { from: f.from < today ? today : f.from, to: f.to };
    default:
      return null;
  }
}

/** The minimal event shape the filters need, so every tab's own event type can satisfy it. */
export interface Filterable {
  category: EventCategory;
  sourceId: string;
  isFree: boolean;
  /** First and last Malmö day the event covers, yyyy-mm-dd. */
  startDay: string;
  endDay: string;
  /** Malmö start time, HH:MM. */
  startTime: string;
  /** Lower-cased title, venue and description. */
  searchText: string;
}

export function isLongRunning(e: Pick<Filterable, "startDay" | "endDay">) {
  return rangeLength({ from: e.startDay, to: e.endDay }) > LONG_RUNNING_DAYS;
}

interface MatchOptions {
  /** Leave one dimension out, to count what picking another value of it would give. */
  ignore?: "cats" | "sources";
}

/** Build a matcher once per filter set; call it per event. */
export function matcher(f: EventFilters, today: string, { ignore }: MatchOptions = {}) {
  const range = resolveRange(f, today);
  const q = f.q.toLowerCase();
  return (e: Filterable) => {
    if (ignore !== "cats" && f.cats.length && !f.cats.includes(e.category)) return false;
    if (ignore !== "sources" && f.sources.length && !f.sources.includes(e.sourceId)) return false;
    if (f.free && !e.isFree) return false;
    if (f.hideLong && isLongRunning(e)) return false;
    if (range && (e.startDay > range.to || e.endDay < range.from)) return false;
    if (f.when === "tonight" && (e.startDay !== today || e.startTime < EVENING_FROM || isLongRunning(e))) return false;
    if (q && !e.searchText.includes(q)) return false;
    return true;
  };
}

export interface Facets {
  total: number;
  categories: Partial<Record<EventCategory, number>>;
  sources: Record<string, number>;
}

/**
 * The number of matching events, and per category and source how many there
 * would be with that one value picked (the other filters still applied).
 */
export function facetCounts(events: Filterable[], f: EventFilters, today: string): Facets {
  const all = matcher(f, today);
  const anyCat = matcher(f, today, { ignore: "cats" });
  const anySource = matcher(f, today, { ignore: "sources" });
  const facets: Facets = { total: 0, categories: {}, sources: {} };
  for (const e of events) {
    if (all(e)) facets.total++;
    if (anyCat(e)) facets.categories[e.category] = (facets.categories[e.category] ?? 0) + 1;
    if (anySource(e)) facets.sources[e.sourceId] = (facets.sources[e.sourceId] ?? 0) + 1;
  }
  return facets;
}

const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

function endOf(event: MalmoEvent) {
  const start = new Date(event.startsAt);
  return event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);
}

/** The fields the filters look at, from a full event. */
export function toFilterable(e: MalmoEvent): Filterable {
  const start = new Date(e.startsAt);
  const startDay = localDay(start);
  const endDay = e.endsAt ? localDay(new Date(e.endsAt)) : startDay;
  return {
    category: e.category,
    sourceId: e.sourceId,
    isFree: e.isFree,
    startDay,
    endDay: endDay < startDay ? startDay : endDay,
    startTime: localTime(start),
    searchText: `${e.title} ${e.venue?.name ?? ""} ${(e.description ?? "").slice(0, 300)}`.toLowerCase(),
  };
}

/** True if the event hasn't finished yet. */
export function isUpcoming(event: MalmoEvent, now: Date) {
  return endOf(event) >= now;
}
