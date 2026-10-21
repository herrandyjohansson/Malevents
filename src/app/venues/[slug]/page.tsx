import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { EventCard } from "@/components/events/event-card";
import { EventGridSkeleton } from "@/components/events/event-grid-skeleton";
import { SpotlightList } from "@/components/events/spotlight-list";
import { PageHeader } from "@/components/layout/page-header";
import { VenueMap } from "@/components/venues/venue-map";
import { formatDayMonth } from "@/lib/days";
import { PendingSources } from "@/components/events/pending-sources";
import { getAllEvents } from "@/lib/events/aggregate";
import { pendingNames } from "@/lib/events/pending";
import { AREA_NAMES } from "@/lib/events/areas";
import { CATEGORY_LABELS } from "@/lib/events/format";
import { localDay } from "@/lib/events/malmo-time";
import { buildMapEvents } from "@/lib/events/map-data";
import { buildVenues } from "@/lib/events/venue-data";

export async function generateMetadata({ params }: PageProps<"/venues/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // Request-time: the venue list depends on the current time and the live feed.
  await connection();
  const { events } = await getAllEvents();
  const venue = buildVenues(events, new Date()).find((v) => v.slug === slug);
  return venue
    ? { title: venue.name, description: `${venue.events.length} upcoming events at ${venue.name}, Malmö.` }
    : { title: "Venue not found", robots: { index: false } };
}

export default function VenuePage({ params }: PageProps<"/venues/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pt-6 pb-12 sm:px-6">
      <Link
        href="/venues"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        All venues
      </Link>
      <Suspense fallback={<EventGridSkeleton />}>
        <VenueDetail params={params} />
      </Suspense>
    </main>
  );
}

async function VenueDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Request-time: reads admin settings and hides events that have ended.
  await connection();
  const now = new Date();
  let { events, sources } = await getAllEvents();
  let venue = buildVenues(events, now).find((v) => v.slug === slug);
  // Not among the sources that have answered yet: it may be at a venue only a slow source lists.
  if (!venue && pendingNames(sources).length > 0) {
    ({ events, sources } = await getAllEvents("complete"));
    venue = buildVenues(events, now).find((v) => v.slug === slug);
  }
  if (!venue) notFound();

  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  const mapEvents = buildMapEvents(venue.events, sources, now);
  const free = venue.events.filter((e) => e.isFree).length;
  const place = [venue.address || venue.city, venue.area && AREA_NAMES[venue.area]].filter(Boolean).join(" · ");
  const kinds = venue.categories
    .filter((c) => c.category !== "other")
    .slice(0, 2)
    .map((c) => CATEGORY_LABELS[c.category].toLowerCase());
  const facts = [
    `${venue.events.length} upcoming ${venue.events.length === 1 ? "event" : "events"}`,
    venue.events[0] && `next on ${shortDate(venue.events[0].startsAt)}`,
    kinds.length && `mostly ${kinds.join(" and ")}`,
    free > 0 && `${free} free`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <PendingSources names={pendingNames(sources)} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-end">
        <PageHeader size="compact" title={venue.name} description={place || undefined} className="pt-0" />
        {mapEvents.length > 0 && (
          <div className="h-48 overflow-hidden rounded-2xl border">
            <VenueMap events={mapEvents} />
          </div>
        )}
      </div>

      <p className="text-muted-foreground -mt-4">{facts.join(", ").replace(/^./, (c) => c.toUpperCase())}.</p>

      <h2 className="-mb-3 text-xl font-semibold tracking-tight">Upcoming at {venue.name}</h2>

      <SpotlightList className="rise-in grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {venue.events.map((event) => (
          <li key={event.id} className="flex [&>*]:flex-1">
            <EventCard event={event} sourceName={sourceNames.get(event.sourceId) ?? event.sourceId} />
          </li>
        ))}
      </SpotlightList>
    </div>
  );
}

function shortDate(iso: string) {
  return formatDayMonth(localDay(new Date(iso)));
}
