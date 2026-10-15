import { CalendarX } from "lucide-react";
import { connection } from "next/server";

import { FilterBar } from "@/components/filters/filter-bar";
import { ClearFiltersButton } from "@/components/filters/clear-filters-button";
import { addMonths } from "@/lib/days";
import { getAllEvents } from "@/lib/events/aggregate";
import { facetCounts, isUpcoming, matcher, parseFilters, toFilterable } from "@/lib/events/filters";
import { localDay } from "@/lib/events/malmo-time";

import { EventCard } from "./event-card";
import { SourceStatusBar } from "./source-status";
import { SpotlightList } from "./spotlight-list";

/** The shared filter bar and the matching events. Filtering happens here, on the server. */
export async function EventResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  // Request-time: reads admin settings and hides events that have ended.
  await connection();
  const { events, sources } = await getAllEvents();
  const now = new Date();
  const today = localDay(now);
  const upcoming = events.filter((e) => isUpcoming(e, now)).map((e) => ({ event: e, f: toFilterable(e) }));
  const facets = facetCounts(
    upcoming.map((u) => u.f),
    filters,
    today,
  );
  const matches = matcher(filters, today);
  const visible = upcoming.filter((u) => matches(u.f)).map((u) => u.event);
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  const latest = upcoming.reduce((max, u) => (u.f.startDay > max ? u.f.startDay : max), addMonths(today, 1));
  const lastMonth = latest > addMonths(today, 12) ? addMonths(today, 12) : latest;

  return (
    <div className="flex flex-col gap-6">
      <div className="glass z-10 rounded-2xl lg:sticky lg:top-[4.25rem] border p-2.5 shadow-[0_10px_40px_-20px_rgb(0_0_0/80%)]">
        <FilterBar
          mode="server"
          facets={facets}
          sources={sources.filter((s) => s.enabled).map(({ id, name }) => ({ id, name }))}
          today={today}
          lastMonth={lastMonth}
        />
      </div>
      <SourceStatusBar sources={sources} />
      {visible.length > 0 ? (
        <SpotlightList className="rise-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((event) => (
            <li key={event.id} className="flex [&>*]:flex-1">
              <EventCard event={event} sourceName={sourceNames.get(event.sourceId) ?? event.sourceId} />
            </li>
          ))}
        </SpotlightList>
      ) : (
        <div className="bg-card/40 flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
          <CalendarX className="text-muted-foreground size-8" />
          <p className="font-medium">No events match these filters</p>
          <p className="text-muted-foreground max-w-sm text-sm">Try another day, or remove a filter or two.</p>
          <ClearFiltersButton />
        </div>
      )}
    </div>
  );
}
