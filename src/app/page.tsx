import { Suspense } from "react";

import { EventFilters, EventFiltersFallback } from "@/components/events/event-filters";
import { EventGridSkeleton } from "@/components/events/event-grid-skeleton";
import { EventResults } from "@/components/events/event-results";
import { SOURCE_META } from "@/lib/events/sources";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
      {/* Static shell: prerendered and sent immediately. */}
      <section className="flex flex-col gap-3">
        <p className="text-primary text-sm font-medium">Malmö · Skåne</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          What&apos;s on in{" "}
          <span className="from-primary bg-gradient-to-r to-sky-400 bg-clip-text text-transparent">Malmö</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Concerts, exhibitions, sports and markets, gathered from {SOURCE_META.length} sources in one place.
        </p>
      </section>

      <div className="bg-card/60 sticky top-16 z-10 rounded-xl border p-3 backdrop-blur-xl">
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
