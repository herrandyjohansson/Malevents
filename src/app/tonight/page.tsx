import { CalendarDays, Moon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AllDay } from "@/components/tonight/all-day";
import { DayStrip } from "@/components/tonight/day-strip";
import { TimelineEvent } from "@/components/tonight/timeline-event";
import { TonightSearch } from "@/components/tonight/tonight-search";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, dayNames, formatDay, isDay } from "@/lib/days";
import { PendingSources } from "@/components/events/pending-sources";
import { getAllEvents } from "@/lib/events/aggregate";
import { pendingNames } from "@/lib/events/pending";
import { endOf, toFilterable } from "@/lib/events/filters";
import { localDay, localTime } from "@/lib/events/malmo-time";
import { countByDay, groupDay, groupTonight } from "@/lib/events/tonight-data";
import { buildSearchDocuments } from "@/lib/events/search-data";
import type { MalmoEvent } from "@/lib/events/types";

export const metadata: Metadata = { title: "Tonight" };

/** How many days ahead the day strip reaches, today included. */
const STRIP_DAYS = 60;

/** Before this, the page is about today rather than tonight. */
const EVENING_FROM = "15:00";

/** Sections of the rest of the day, by when things start (Malmö time). */
const PARTS = [
  { id: "morning", label: "Morning", until: "12:00" },
  { id: "afternoon", label: "Afternoon", until: "17:00" },
  { id: "evening", label: "Evening", until: "22:00" },
  { id: "late", label: "Late", until: "99:99" },
] as const;

/** A day's events by part of the day; after-midnight shows count as late, unknown times go last. */
function byPartOfDay(events: MalmoEvent[], day: string, isToday: boolean) {
  const parts = PARTS.map((p) => ({
    ...p,
    label: isToday && p.id !== "late" ? `This ${p.label.toLowerCase()}` : p.label,
    events: [] as MalmoEvent[],
  }));
  const unknown: MalmoEvent[] = [];
  for (const e of events) {
    if (e.timeUnknown) {
      unknown.push(e);
      continue;
    }
    const { startDay, startTime } = toFilterable(e);
    const part = startDay > day ? parts[parts.length - 1] : parts.find((p) => startTime < p.until)!;
    part.events.push(e);
  }
  return [
    ...parts.filter((p) => p.events.length > 0),
    ...(unknown.length ? [{ id: "unknown", label: "Time not announced", events: unknown }] : []),
  ];
}

export default function TonightPage({ searchParams }: PageProps<"/tonight">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 pt-5 pb-12 sm:px-6">
      <Suspense fallback={<TonightSkeleton />}>
        <Tonight searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Tonight({ searchParams }: { searchParams: PageProps<"/tonight">["searchParams"] }) {
  // Request-time: everything here is relative to the current minute.
  await connection();
  const [{ events, sources }, params] = await Promise.all([getAllEvents(), searchParams]);
  const now = new Date();
  const today = localDay(now);
  const tomorrow = addDays(today, 1);

  const counts = countByDay(events.filter((e) => endOf(e) >= now));
  const stripDays = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const day = addDays(today, i);
    return { day, count: counts.get(day) ?? 0 };
  });
  // Only days on the strip; anything else (a stale link, a past day) falls back to today.
  const picked = Array.isArray(params.day) ? params.day[0] : params.day;
  const day = isDay(picked) && picked > today && picked <= stripDays.at(-1)!.day ? picked : today;
  const strip = <DayStrip days={stripDays} today={today} selected={day} />;
  const documents = buildSearchDocuments(events, now);

  if (day !== today) {
    return (
      <>
        {strip}
        <TonightSearch documents={documents} pending={pendingNames(sources)}>
          <DayView day={day} isTomorrow={day === tomorrow} events={events} pending={pendingNames(sources)} />
        </TonightSearch>
      </>
    );
  }

  const { live, later, allDay, tomorrow: tomorrowEvents } = groupTonight(events, now);

  const nothingLeft = live.length === 0 && later.length === 0;
  // Once nothing else starts tonight, look ahead to tomorrow instead.
  const showTomorrow = later.length === 0;
  const timeline = showTomorrow ? tomorrowEvents : later;

  return (
    <>
      {strip}
      <TonightSearch documents={documents} pending={pendingNames(sources)}>
        <PageHeader
          size="compact"
          title={nothingLeft ? "Quiet now. Tomorrow has more." : localTime(now) < EVENING_FROM ? "Today in Malmö" : "Tonight in Malmö"}
          description={`${formatDay(today)}, ${localTime(now)}. ${summary(live.length, later.length)}`}
        />
        <PendingSources names={pendingNames(sources)} />

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
            byPartOfDay(timeline, today, true).map((part) => (
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

        <AllDay events={allDay} />

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
      </TonightSearch>
    </>
  );
}

/** A later day picked on the strip: the same sections as today, without "Happening now". */
function DayView({
  day,
  isTomorrow,
  events: all,
  pending,
}: {
  day: string;
  isTomorrow: boolean;
  events: MalmoEvent[];
  pending: string[];
}) {
  const { events, allDay } = groupDay(all, day);
  const { weekday } = dayNames(day);
  const count = events.length === 1 ? "1 thing" : `${events.length} things`;

  return (
    <>
      <PageHeader
        size="compact"
        title={`${isTomorrow ? "Tomorrow" : weekday} in Malmö`}
        description={`${formatDay(day)}. ${events.length ? `${count} on.` : "Nothing listed yet."}`}
      />
      <PendingSources names={pending} />

      {events.length > 0 ? (
        byPartOfDay(events, day, false).map((part) => (
          <section key={part.id} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Moon className="text-primary size-4" aria-hidden />
              {part.label}
            </h2>
            <Timeline events={part.events} />
          </section>
        ))
      ) : (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm">
          Nothing listed for {formatDay(day)} yet.
        </p>
      )}

      <AllDay events={allDay} />

      <div className="flex flex-wrap justify-center gap-2 pt-2">
        <Button asChild variant="outline">
          <Link href={`/?from=${day}&to=${day}`}>
            <CalendarDays />
            Browse this day
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/map?from=${day}&to=${day}`}>This day on the map</Link>
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
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-hidden py-1">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-14 shrink-0 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-10 w-full rounded-full" />
      <Skeleton className="h-12 w-80" />
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="ml-[4.75rem] h-24 rounded-2xl" />
      ))}
    </div>
  );
}
