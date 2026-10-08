import { Suspense } from "react";

import { EventFilters, EventFiltersFallback } from "@/components/events/event-filters";
import { EventGridSkeleton } from "@/components/events/event-grid-skeleton";
import { EventResults } from "@/components/events/event-results";
import { SOURCE_META } from "@/lib/events/sources";

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-16">
      {/* Static shell: prerendered and sent immediately. */}
      <header className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">Malevents</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What&apos;s on in Malmö</h1>
        <p className="text-muted-foreground max-w-2xl">
          Concerts, exhibitions, sports, markets and more, gathered from {SOURCE_META.length} sources in one
          place.
        </p>
      </header>

      <Suspense fallback={<EventFiltersFallback />}>
        <EventFilters sources={SOURCE_META.map(({ id, name }) => ({ id, name }))} />
      </Suspense>

      {/* Request-time: depends on search params, streamed in behind a skeleton. */}
      <Suspense fallback={<EventGridSkeleton />}>
        <EventResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
