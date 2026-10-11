import { Map as MapIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { EventFilters, EventFiltersFallback } from "@/components/events/event-filters";
import { EventGridSkeleton } from "@/components/events/event-grid-skeleton";
import { EventResults } from "@/components/events/event-results";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { WeekMapPreview, WeekMapPreviewSkeleton } from "@/components/map/week-map-preview";
import { SOURCE_META } from "@/lib/events/sources";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 pb-12 sm:px-6">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,30rem)]">
        {/* Static shell: prerendered and sent immediately. */}
        <PageHeader
          size="hero"
          eyebrow="Malmö · Skåne"
          title={
            <>
              What&apos;s on in <span className="text-gradient">Malmö</span>
            </>
          }
          description={`Concerts, theatre, exhibitions, sports and markets, gathered from ${SOURCE_META.length} sources and kept fresh every hour.`}
        >
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/?when=weekend">
                <Sparkles />
                This weekend
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/map">
                <MapIcon />
                Explore the map
              </Link>
            </Button>
          </div>
        </PageHeader>
        <Suspense fallback={<WeekMapPreviewSkeleton />}>
          <WeekMapPreview />
        </Suspense>
      </div>

      <div className="glass sticky top-[4.25rem] z-10 rounded-2xl border p-2.5 shadow-[0_10px_40px_-20px_rgb(0_0_0/80%)]">
        <Suspense fallback={<EventFiltersFallback />}>
          <EventFilters sources={SOURCE_META.map(({ id, name }) => ({ id, name }))} />
        </Suspense>
      </div>

      {/* Request-time: depends on search params, streamed in behind a skeleton. */}
      <Suspense fallback={<EventGridSkeleton />}>
        <EventResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
