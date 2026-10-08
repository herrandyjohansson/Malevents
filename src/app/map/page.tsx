import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { EventMapView } from "@/components/map/event-map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllEvents } from "@/lib/events/aggregate";
import { isUpcoming } from "@/lib/events/filters";
import { buildMapViews } from "@/lib/events/map-data";
import { hasCoordinates } from "@/lib/events/venues";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Events on the map</h1>
        <p className="text-muted-foreground">
          See the coming week at a glance, or pick a single day to see where things are happening.
        </p>
      </section>
      <Suspense fallback={<MapSkeleton />}>
        <MapData />
      </Suspense>
    </main>
  );
}

async function MapData() {
  // Request-time: reads admin settings and filters by the current time.
  await connection();
  const { events, sources } = await getAllEvents();
  const now = new Date();
  const unplaced = events.filter((e) => isUpcoming(e, now) && !hasCoordinates(e)).length;

  return <EventMapView views={buildMapViews(events, sources, now)} unplacedCount={unplaced} />;
}

function MapSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-hidden pt-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-14 shrink-0" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-[65vh]" />
        <Skeleton className="h-[65vh]" />
      </div>
    </div>
  );
}
