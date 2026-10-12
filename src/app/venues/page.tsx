import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { VenueGrid } from "@/components/venues/venue-grid";
import { getAllEvents } from "@/lib/events/aggregate";
import { formatEventDate } from "@/lib/events/format";
import { buildVenues } from "@/lib/events/venue-data";

export const metadata: Metadata = { title: "Venues" };

export default function VenuesPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-12 sm:px-6">
      <PageHeader
        eyebrow="Venues"
        title="Malmö's stages, clubs and halls"
        description="Every place with something coming up, from the opera to the smallest club. Open one to see its whole programme."
      />
      <Suspense fallback={<VenuesSkeleton />}>
        <VenueData />
      </Suspense>
    </main>
  );
}

async function VenueData() {
  // Request-time: reads admin settings and hides events that have ended.
  await connection();
  const { events } = await getAllEvents();
  const venues = buildVenues(events, new Date());
  return (
    <VenueGrid
      venues={venues.map((v) => ({
        slug: v.slug,
        name: v.name,
        address: [v.address, v.city].filter(Boolean).join(", ") || undefined,
        count: v.events.length,
        categories: v.categories,
        imageUrl: v.imageUrl,
        next: v.events[0] && { title: v.events[0].title, dateLabel: formatEventDate(v.events[0]) },
      }))}
    />
  );
}

function VenuesSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-14 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-60 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
