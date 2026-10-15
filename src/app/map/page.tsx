import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { EventMapView } from "@/components/map/event-map-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllEvents } from "@/lib/events/aggregate";
import { isUpcoming } from "@/lib/events/filters";
import { localDay } from "@/lib/events/malmo-time";
import { buildMapEvents } from "@/lib/events/map-data";
import { hasCoordinates } from "@/lib/events/venues";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-10 sm:px-6">
      {/* On phones the map takes the whole screen, so the intro is for screen readers only. */}
      <PageHeader
        className="max-lg:sr-only"
        size="compact"
        eyebrow="Map"
        title="Where it's happening"
        description="Filter by day, category or price, or drag across the calendar to see where things are on those days."
      />
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

  return (
    <EventMapView
      events={buildMapEvents(events, sources, now)}
      today={localDay(now)}
      unplacedCount={unplaced}
      sources={sources.filter((s) => s.enabled).map(({ id, name }) => ({ id, name }))}
    />
  );
}

function MapSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-[72vh] max-lg:hidden" />
        <Skeleton className="h-[72vh] max-lg:fixed max-lg:inset-x-0 max-lg:top-14 max-lg:bottom-(--tabbar-h) max-lg:h-auto max-lg:rounded-none" />
      </div>
    </div>
  );
}
