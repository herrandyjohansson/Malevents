import { CalendarX } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";

import { Button } from "@/components/ui/button";
import { getAllEvents } from "@/lib/events/aggregate";
import { applyFilters, parseFilters } from "@/lib/events/filters";

import { EventCard } from "./event-card";
import { SourceStatusBar } from "./source-status";
import { SpotlightList } from "./spotlight-list";

export async function EventResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  // Request-time: reads admin settings and hides events that have ended.
  await connection();
  const { events, sources } = await getAllEvents();
  const visible = applyFilters(events, filters, new Date());
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-6">
      <SourceStatusBar sources={sources} />
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {visible.length === 1 ? "1 event" : `${visible.length} events`}
      </p>
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Clear filters</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
