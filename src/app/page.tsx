import { Suspense } from "react";

import { EventGridSkeleton } from "@/components/events/event-grid-skeleton";
import { EventResults } from "@/components/events/event-results";
import { ViewToggle } from "@/components/events/view-toggle";
import { WeekMapPreview, WeekMapPreviewSkeleton } from "@/components/map/week-map-preview";

export default async function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 pt-5 pb-12 sm:px-6 lg:pt-8">
      {/* Static shell: prerendered and sent immediately. */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">What&apos;s on in Malmö</h1>
          <p className="text-muted-foreground max-sm:hidden">
            Concerts, stage, clubs, sport and more at the city&apos;s venues. Pick a time and an area.
          </p>
        </div>
        {/* From tablet width up: a month grid is no way to browse on a phone. */}
        <div className="max-sm:hidden">
          <Suspense fallback={null}>
            <ViewToggleFromParams searchParams={searchParams} />
          </Suspense>
        </div>
      </div>

      {/* Request-time: depends on search params, streamed in behind a skeleton. */}
      <Suspense fallback={<EventGridSkeleton />}>
        <EventResults searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<WeekMapPreviewSkeleton />}>
        <WeekMapPreview />
      </Suspense>
    </main>
  );
}

async function ViewToggleFromParams({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const { view } = await searchParams;
  return <ViewToggle view={view === "calendar" ? "calendar" : "list"} />;
}
