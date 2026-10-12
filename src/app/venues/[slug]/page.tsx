import { ArrowLeft, CalendarDays, MapPin, Ticket } from "lucide-react";
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
import { getAllEvents } from "@/lib/events/aggregate";
import { TIME_ZONE } from "@/lib/events/config";
import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/events/format";
import { buildMapEvents } from "@/lib/events/map-data";
import { buildVenues } from "@/lib/events/venue-data";

export const metadata: Metadata = { title: "Venue" };

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
  const { events, sources } = await getAllEvents();
  const now = new Date();
  const venue = buildVenues(events, now).find((v) => v.slug === slug);
  if (!venue) notFound();

  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  const mapEvents = buildMapEvents(venue.events, sources, now);
  const free = venue.events.filter((e) => e.isFree).length;
  const address = [venue.address, venue.city].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-end">
        <PageHeader size="compact" eyebrow="Venue" title={venue.name} description={address || undefined} className="pt-0" />
        {mapEvents.length > 0 && (
          <div className="h-48 overflow-hidden rounded-2xl border">
            <VenueMap events={mapEvents} />
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={CalendarDays} label="Upcoming" value={venue.events.length} />
        <Stat icon={Ticket} label="Free" value={free} />
        <Stat icon={MapPin} label="Next" value={venue.events[0] ? shortDate(venue.events[0].startsAt) : "–"} />
        <div className="bg-card/60 flex flex-col gap-1.5 rounded-2xl border p-3.5">
          <dt className="text-muted-foreground text-xs">Mostly</dt>
          <dd className="flex flex-wrap gap-1">
            {venue.categories.slice(0, 2).map((c) => (
              <span key={c.category} className="text-sm font-medium" style={{ color: CATEGORY_COLORS[c.category] }}>
                {CATEGORY_EMOJI[c.category]} {CATEGORY_LABELS[c.category]}
              </span>
            ))}
          </dd>
        </div>
      </dl>

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

function Stat({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-card/60 flex flex-col gap-1 rounded-2xl border p-3.5">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

const shortFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "short" });

function shortDate(iso: string) {
  return shortFormat.format(new Date(iso));
}
