import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { CalendarView } from "@/components/calendar/calendar-view";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllEvents } from "@/lib/events/aggregate";
import { buildCalendarEvents } from "@/lib/events/calendar-data";
import { localDay } from "@/lib/events/malmo-time";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem-var(--tabbar-h))] w-full max-w-[1600px] flex-1 flex-col gap-3 px-4 pb-4 sm:px-6">
      <PageHeader size="compact" eyebrow="Calendar" title="The month at a glance" className="pb-2" />
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarData />
      </Suspense>
    </main>
  );
}

async function CalendarData() {
  // Request-time: reads admin settings and anchors the calendar on today.
  await connection();
  const { events, sources } = await getAllEvents();
  const now = new Date();

  return (
    <CalendarView
      events={buildCalendarEvents(events, sources, now)}
      today={localDay(now)}
      sources={sources.filter((s) => s.enabled).map(({ id, name }) => ({ id, name }))}
    />
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <Skeleton className="h-24" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="min-h-[32rem] flex-1" />
    </div>
  );
}
