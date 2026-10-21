import { CalendarDays, Moon, Palette } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { TimelineEvent } from "@/components/tonight/timeline-event";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, formatDay } from "@/lib/days";
import { getAllEvents } from "@/lib/events/aggregate";
import { toFilterable } from "@/lib/events/filters";
import { localDay, localTime } from "@/lib/events/malmo-time";
import { groupTonight } from "@/lib/events/tonight-data";
import type { MalmoEvent } from "@/lib/events/types";

export const metadata: Metadata = { title: "Tonight" };

/** Before this, the page is about today rather than tonight. */
const EVENING_FROM = "15:00";

/** Sections of the rest of the day, by when things start (Malmö time). */
const PARTS = [
  { id: "morning", label: "This morning", until: "12:00" },
  { id: "afternoon", label: "This afternoon", until: "17:00" },
  { id: "evening", label: "This evening", until: "22:00" },
  { id: "late", label: "Late", until: "99:99" },
] as const;

/** Today's events by part of the day; after-midnight shows count as late, unknown times go last. */
function byPartOfDay(events: MalmoEvent[], today: string) {
  const parts = PARTS.map((p) => ({ ...p, events: [] as MalmoEvent[] }));
  const unknown: MalmoEvent[] = [];
  for (const e of events) {
    if (e.timeUnknown) {
      unknown.push(e);
      continue;
    }
    const { startDay, startTime } = toFilterable(e);
    const part = startDay > today ? parts[parts.length - 1] : parts.find((p) => startTime < p.until)!;
    part.events.push(e);
  }
  return [
    ...parts.filter((p) => p.events.length > 0),
    ...(unknown.length ? [{ id: "unknown", label: "Time not announced", events: unknown }] : []),
  ];
}

export default function TonightPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 pb-12 sm:px-6">
      <Suspense fallback={<TonightSkeleton />}>
        <Tonight />
      </Suspense>
    </main>
  );
}

async function Tonight() {
  // Request-time: everything here is relative to the current minute.
  await connection();
  const { events } = await getAllEvents();
  const now = new Date();
  const today = localDay(now);
  const tomorrow = addDays(today, 1);

  const { live, later, allDay, tomorrow: tomorrowEvents } = groupTonight(events, now);

  const nothingLeft = live.length === 0 && later.length === 0;
  // Once nothing else starts tonight, look ahead to tomorrow instead.
  const showTomorrow = later.length === 0;
  const timeline = showTomorrow ? tomorrowEvents : later;

  return (
    <>
      <PageHeader
        title={nothingLeft ? "Quiet now. Tomorrow has more." : localTime(now) < EVENING_FROM ? "Today in Malmö" : "Tonight in Malmö"}
        description={`${formatDay(today)}, ${localTime(now)}. ${summary(live.length, later.length)}`}
      />

      {live.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <span className="relative flex size-2.5">
              <span className="bg-destructive absolute inset-0 animate-ping rounded-full opacity-75" />
              <span className="bg-destructive relative size-2.5 rounded-full" />
            </span>
            Happening now
          </h2>
          <ul className="rise-in grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {live.map((e) => (
              <li key={e.id}>
                <TimelineEvent event={e} live />
              </li>
            ))}
          </ul>
        </section>
      )}

      {timeline.length > 0 ? (
        showTomorrow ? (
          <section className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Moon className="text-primary size-4" aria-hidden />
              Tomorrow, {formatDay(tomorrow)}
            </h2>
            <Timeline events={timeline} />
          </section>
        ) : (
          byPartOfDay(timeline, today).map((part) => (
            <section key={part.id} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Moon className="text-primary size-4" aria-hidden />
                {part.label}
              </h2>
              <Timeline events={part.events} />
            </section>
          ))
        )
      ) : (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm">
          Nothing listed for tomorrow yet.
        </p>
      )}

      {allDay.length > 0 && (
        <details className="group bg-card/50 rounded-2xl border">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <Palette className="text-muted-foreground size-4" />
            Open all day: {allDay.length === 1 ? "1 exhibition" : `${allDay.length} exhibitions`} and multi-day events
            <span className="text-muted-foreground ml-auto text-xs group-open:hidden">Show</span>
            <span className="text-muted-foreground ml-auto hidden text-xs group-open:inline">Hide</span>
          </summary>
          <ul className="grid grid-cols-1 gap-2.5 p-2.5 pt-0 sm:grid-cols-2">
            {allDay.map((e) => (
              <li key={e.id}>
                <TimelineEvent event={e} />
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex flex-wrap justify-center gap-2 pt-2">
        <Button asChild variant="outline">
          <Link href="/?when=weekend">
            <CalendarDays />
            See the weekend
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/map?when=tonight">Tonight on the map</Link>
        </Button>
      </div>
    </>
  );
}

/** The line under the heading: what is on now and what is still to come. */
function summary(liveCount: number, laterCount: number) {
  if (liveCount === 0 && laterCount === 0) {
    return "Everything on today has started or finished. Here is what's coming up tomorrow.";
  }
  if (laterCount === 0) {
    return `${liveCount === 1 ? "1 thing is" : `${liveCount} things are`} on right now. Nothing else starts later today.`;
  }
  const onNow = liveCount ? `, and ${liveCount} on right now` : "";
  return `${laterCount === 1 ? "1 thing" : `${laterCount} things`} still to come today${onNow}.`;
}

/** Events grouped under their starting hour, on a glowing vertical line. */
function Timeline({ events }: { events: MalmoEvent[] }) {
  const groups = new Map<string, MalmoEvent[]>();
  for (const e of events) {
    const hour = e.timeUnknown ? "TBA" : `${localTime(new Date(e.startsAt)).slice(0, 2)}:00`;
    groups.set(hour, [...(groups.get(hour) ?? []), e]);
  }
  return (
    <ol className="relative flex flex-col gap-6 pl-[4.75rem]">
      <span
        aria-hidden
        className="from-primary via-primary/40 absolute top-2 bottom-2 left-[3.75rem] w-px bg-gradient-to-b to-transparent"
      />
      {[...groups.entries()].map(([hour, list]) => (
        <li key={hour} className="relative flex flex-col gap-2.5">
          <span className="text-muted-foreground absolute top-0 -left-[4.75rem] w-12 text-right text-xs leading-5 font-semibold tabular-nums">
            {hour}
          </span>
          <span
            aria-hidden
            className="bg-background border-primary absolute top-[5px] left-[calc(-1rem-5px)] size-2.5 rounded-full border-2"
          />
          <ul className="rise-in flex flex-col gap-2.5">
            {list.map((e) => (
              <li key={e.id}>
                <TimelineEvent event={e} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function TonightSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-10">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-12 w-80" />
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="ml-[4.75rem] h-24 rounded-2xl" />
      ))}
    </div>
  );
}
