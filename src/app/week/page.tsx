import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { HighlightReel } from "@/components/week/highlight-reel";
import { WeekBoard } from "@/components/week/week-board";
import { getAllEvents } from "@/lib/events/aggregate";
import { buildWeek, pickHighlights } from "@/lib/events/week-data";

export const metadata: Metadata = { title: "Week" };

export default function WeekPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-12 sm:px-6">
      <PageHeader
        eyebrow="Week"
        title="The week ahead"
        description="A few picks to flick through, then every day laid out side by side."
      />
      <Suspense fallback={<WeekSkeleton />}>
        <WeekData />
      </Suspense>
    </main>
  );
}

async function WeekData() {
  // Request-time: reads admin settings and anchors the week on today.
  await connection();
  const { events } = await getAllEvents();
  const { week, ongoing } = buildWeek(events, new Date());

  return (
    <>
      <HighlightReel events={pickHighlights(week)} />
      <WeekBoard week={week} ongoing={ongoing} />
    </>
  );
}

function WeekSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-4 overflow-hidden py-4">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-52 shrink-0 sm:w-[17rem] rounded-2xl" />
        ))}
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-96 w-[19rem] shrink-0 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
