import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { EventMapView } from "@/components/map/event-map-view";
import type { MapDay, MapEvent } from "@/components/map/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllEvents } from "@/lib/events/aggregate";
import { isUpcoming, localDay } from "@/lib/events/filters";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  dateParts,
  formatDayLabel,
  formatEventDate,
  formatPrice,
} from "@/lib/events/format";
import { hasCoordinates } from "@/lib/events/venues";

export const metadata: Metadata = { title: "Map" };

const DAYS_AHEAD = 14;

export default function MapPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Events on the map</h1>
        <p className="text-muted-foreground">Pick a day to see where things are happening around Malmö.</p>
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
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));

  const upcoming = events.filter((e) => isUpcoming(e, now));
  const unplaced = upcoming.filter((e) => !hasCoordinates(e)).length;

  const days: MapDay[] = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const date = new Date(now.getTime() + i * 86_400_000);
    const day = localDay(date);
    const { weekday, day: dayOfMonth, month } = dateParts(date.toISOString());
    const dayEvents: MapEvent[] = upcoming
      .filter((e) => {
        const start = localDay(new Date(e.startsAt));
        const end = e.endsAt ? localDay(new Date(e.endsAt)) : start;
        return hasCoordinates(e) && start <= day && end >= day;
      })
      .map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        categoryLabel: CATEGORY_LABELS[e.category],
        color: CATEGORY_COLORS[e.category],
        venueName: e.venue!.name,
        lat: e.venue!.lat!,
        lng: e.venue!.lng!,
        timeLabel: formatEventDate(e),
        priceLabel: formatPrice(e),
        url: e.url,
        sourceName: sourceNames.get(e.sourceId) ?? e.sourceId,
      }));
    return { day, weekday, dayOfMonth, month, label: formatDayLabel(day), events: dayEvents };
  });

  return <EventMapView days={days} unplacedCount={unplaced} />;
}

function MapSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-14 shrink-0" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-[60vh]" />
        <Skeleton className="h-[60vh]" />
      </div>
    </div>
  );
}
