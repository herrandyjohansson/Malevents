import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { isDay } from "@/components/map/days";
import { EventMapView } from "@/components/map/event-map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllEvents } from "@/lib/events/aggregate";
import { isUpcoming, localDay } from "@/lib/events/filters";
import { buildMapEvents } from "@/lib/events/map-data";
import { hasCoordinates } from "@/lib/events/venues";

export const metadata: Metadata = { title: "Map" };

type SearchParams = PageProps<"/map">["searchParams"];

export default function MapPage({ searchParams }: PageProps<"/map">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Events on the map</h1>
        <p className="text-muted-foreground">
          Drag across the calendar, say Friday to Sunday, to see where things are happening on those days.
        </p>
      </section>
      <Suspense fallback={<MapSkeleton />}>
        <MapData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MapData({ searchParams }: { searchParams: SearchParams }) {
  // Request-time: reads admin settings and filters by the current time.
  await connection();
  const { from, to } = await searchParams;
  const { events, sources } = await getAllEvents();
  const now = new Date();
  const unplaced = events.filter((e) => isUpcoming(e, now) && !hasCoordinates(e)).length;

  const today = localDay(now);
  // ?from=yyyy-mm-dd&to=yyyy-mm-dd makes a picked range shareable.
  const initialRange = isDay(from) && isDay(to) && from <= to && to >= today ? { from, to } : undefined;

  return (
    <EventMapView
      events={buildMapEvents(events, sources, now)}
      today={today}
      initialRange={initialRange}
      unplacedCount={unplaced}
    />
  );
}

function MapSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-[72vh]" />
        <Skeleton className="h-[72vh]" />
      </div>
    </div>
  );
}
