import { CalendarX, ChevronDown } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { CalendarView } from "@/components/calendar/calendar-view";
import { FilterBar } from "@/components/filters/filter-bar";
import { ClearFiltersButton } from "@/components/filters/clear-filters-button";
import { TimelineEvent } from "@/components/tonight/timeline-event";
import { getAllEvents } from "@/lib/events/aggregate";
import { buildCalendarEvents } from "@/lib/events/calendar-data";
import { groupByDay, takeEvents } from "@/lib/events/discover-data";
import {
  facetCounts,
  filtersToParams,
  isUpcoming,
  lastEventDay,
  matcher,
  parseFilters,
  resolveRange,
  toFilterable,
} from "@/lib/events/filters";
import { localDay } from "@/lib/events/malmo-time";
import { pendingNames } from "@/lib/events/pending";

import { EventCard } from "./event-card";
import { PendingSources } from "./pending-sources";
import { SourceAlert, SourceList } from "./source-status";
import { SpotlightList } from "./spotlight-list";

/** Events per "page"; "Show more" adds this many again. */
const PAGE = 24;
/** Highest `show` honoured, so a crafted URL can't ask for the whole feed at once. */
const MAX_SHOW = 480;

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string) {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Discover's results under the filter bar: events grouped by day, PAGE at a
 * time, or the same filtered events as a month calendar (`?view=calendar`).
 * List filtering happens here on the server; the calendar filters in the browser.
 */
export async function EventResults({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const view = one(params, "view") === "calendar" ? "calendar" : "list";
  const show = Math.min(MAX_SHOW, Math.max(PAGE, Math.round(Number(one(params, "show")) / PAGE) * PAGE || PAGE));
  // Request-time: reads admin settings and hides events that have ended.
  await connection();
  const { events, sources } = await getAllEvents();
  const now = new Date();
  const today = localDay(now);
  const enabledSources = sources.filter((s) => s.enabled).map(({ id, name }) => ({ id, name }));

  if (view === "calendar") {
    return (
      <div className="flex flex-col gap-6">
        <SourceAlert sources={sources} />
        <PendingSources names={pendingNames(sources)} />
        <CalendarView events={buildCalendarEvents(events, sources, now)} today={today} sources={enabledSources} />
        <SourceList sources={sources} />
      </div>
    );
  }

  const upcoming = events.filter((e) => isUpcoming(e, now)).map((e) => ({ event: e, f: toFilterable(e) }));
  const filterables = upcoming.map((u) => u.f);
  const facets = facetCounts(filterables, filters, today);
  const matches = matcher(filters, today);
  const visible = upcoming.filter((u) => matches(u.f)).map((u) => u.event);
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  // With a later time picked (next weekend), events already running sit under its first day.
  const groups = takeEvents(groupByDay(visible, today, resolveRange(filters, today)?.from), show);
  const moreParams = filtersToParams(filters);
  moreParams.set("show", String(show + PAGE));

  return (
    <div className="flex flex-col gap-6">
      <div className="glass z-10 rounded-2xl border p-2.5 lg:sticky lg:top-[4.25rem]">
        <FilterBar
          mode="server"
          facets={facets}
          sources={enabledSources}
          today={today}
          lastMonth={lastEventDay(filterables, today)}
        />
      </div>
      <SourceAlert sources={sources} />
      <PendingSources names={pendingNames(sources)} />
      {visible.length > 0 ? (
        <div className="flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.day} aria-labelledby={`day-${group.day}`} className="flex flex-col gap-4">
              <h2 id={`day-${group.day}`} className="flex items-baseline gap-3 text-xl font-semibold tracking-tight">
                {group.label}
                {group.date && <span className="text-muted-foreground text-sm font-normal">{group.date}</span>}
              </h2>
              {/* Phones: compact rows, several per screen. The date is in the day heading above. */}
              <ul className="flex flex-col gap-2.5 sm:hidden">
                {group.events.map((event) => (
                  <li key={event.id}>
                    <TimelineEvent event={event} />
                  </li>
                ))}
              </ul>
              <SpotlightList className="grid gap-5 max-sm:hidden sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.events.map((event) => (
                  <li key={event.id} className="flex [&>*]:flex-1">
                    <EventCard event={event} sourceName={sourceNames.get(event.sourceId) ?? event.sourceId} />
                  </li>
                ))}
              </SpotlightList>
            </section>
          ))}
          {visible.length > show && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-muted-foreground text-sm">
                Showing {show} of {visible.length}
              </p>
              <Link
                href={`/?${moreParams}`}
                scroll={false}
                className="hover:bg-accent inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors"
              >
                <ChevronDown className="size-4" aria-hidden />
                Show {Math.min(PAGE, visible.length - show)} more
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card/40 flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-16 text-center">
          <CalendarX className="text-muted-foreground size-8" />
          <p className="font-medium">
            {filters.q ? <>Nothing matches &ldquo;{filters.q}&rdquo; with these filters</> : "No events match these filters"}
          </p>
          <p className="text-muted-foreground max-w-sm text-sm">
            {filters.when !== "all"
              ? "Try a wider time, like Any time, or remove an area or kind of event."
              : "Try another area or kind of event, or check the spelling."}
          </p>
          <ClearFiltersButton />
        </div>
      )}
      <SourceList sources={sources} />
    </div>
  );
}
