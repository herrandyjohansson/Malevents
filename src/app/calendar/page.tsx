import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { CalendarView } from "@/components/calendar/calendar-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllEvents } from "@/lib/events/aggregate";
import { buildCalendarEvents } from "@/lib/events/calendar-data";
import { localDay } from "@/lib/events/filters";
import { SOURCE_META } from "@/lib/events/sources";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-[1600px] flex-1 flex-col gap-3 px-4 py-4 sm:px-6">
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
      sources={SOURCE_META.map(({ id, name }) => ({ id, name }))}
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
