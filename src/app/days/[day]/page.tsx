import { ArrowLeft, CalendarX, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PendingSources } from "@/components/events/pending-sources";
import { chipClass } from "@/components/filters/chip-class";
import { PageHeader } from "@/components/layout/page-header";
import { AllDay } from "@/components/tonight/all-day";
import { TimelineEvent } from "@/components/tonight/timeline-event";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, dayNames, formatDay, isDay } from "@/lib/days";
import { getAllEvents } from "@/lib/events/aggregate";
import { buildDay } from "@/lib/events/day-data";
import { filtersToParams, parseFilters, type EventFilters } from "@/lib/events/filters";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/events/format";
import { localDay } from "@/lib/events/malmo-time";
import { pendingNames } from "@/lib/events/pending";
import type { EventCategory } from "@/lib/events/types";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/days/[day]">): Promise<Metadata> {
  const { day } = await params;
  return isDay(day) ? { title: formatDay(day) } : { title: "Day not found", robots: { index: false } };
}

/**
 * One date, read by where in Malmö things happen. Reached from the calendar
 * summary with a kind of event picked (`?cat=`); the shared filters in the
 * URL still apply, except their time window, which is this day.
 */
export default function DayPage({ params, searchParams }: PageProps<"/days/[day]">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-6 pb-12 sm:px-6">
      <Suspense fallback={<DaySkeleton />}>
        <Day params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** The filters other than kind and time, as a query string to carry along. */
function carried(filters: EventFilters) {
  return filtersToParams({ ...filters, cats: [], when: "all", from: undefined, to: undefined });
}

function withKind(base: URLSearchParams, cat?: EventCategory) {
  const params = new URLSearchParams(base);
  if (cat) params.set("cat", cat);
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function Day({ params, searchParams }: Pick<PageProps<"/days/[day]">, "params" | "searchParams">) {
  const [{ day }, query] = await Promise.all([params, searchParams]);
  if (!isDay(day)) notFound();
  // Request-time: on today, events that have ended drop off.
  await connection();
  const { events, sources } = await getAllEvents();
  const now = new Date();
  const today = localDay(now);

  const filters = parseFilters(query);
  // One kind at a time here; an older link naming several keeps the first.
  const kind = filters.cats[0];
  const { kinds, total, areas, allDay } = buildDay(events, day, { ...filters, cats: kind ? [kind] : [] }, today, now);
  const base = carried(filters);
  const shown = areas.reduce((n, a) => n + a.events.length, 0);
  const calendarParams = new URLSearchParams(base);
  calendarParams.set("view", "calendar");
  if (day.slice(0, 7) !== today.slice(0, 7)) calendarParams.set("month", day.slice(0, 7));
  const when = day === today ? "Today" : day === addDays(today, 1) ? "Tomorrow" : null;

  return (
    <>
      <nav aria-label="Days" className="flex items-center gap-2">
        <Link
          href={`/?${calendarParams}`}
          className="text-muted-foreground hover:text-foreground mr-auto inline-flex min-h-11 items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {dayNames(day).month} calendar
        </Link>
        <DayStep href={`/days/${addDays(day, -1)}${withKind(base, kind)}`} label="Previous day">
          <ChevronLeft className="size-4" aria-hidden />
        </DayStep>
        <DayStep href={`/days/${addDays(day, 1)}${withKind(base, kind)}`} label="Next day">
          <ChevronRight className="size-4" aria-hidden />
        </DayStep>
      </nav>

      <PageHeader
        size="compact"
        className="pt-0"
        title={
          <>
            {when && <span className="text-primary">{when}, </span>}
            {formatDay(day)}
          </>
        }
        description={summary(total, shown, kind)}
      />
      <PendingSources names={pendingNames(sources)} />

      {total > 0 && (
        <ul aria-label="Kinds of event" className="no-scrollbar fade-edges -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <li>
            <Link
              href={`/days/${day}${withKind(base)}`}
              replace
              scroll={false}
              aria-current={!kind ? "page" : undefined}
              className={chipClass(!kind)}
            >
              All
              <span className="tabular-nums opacity-70">{total}</span>
            </Link>
          </li>
          {kinds.map(({ category, count }) => (
            <li key={category}>
              <Link
                href={`/days/${day}${withKind(base, category)}`}
                replace
                scroll={false}
                aria-current={kind === category ? "page" : undefined}
                className={chipClass(kind === category)}
              >
                <span aria-hidden className="size-2 rounded-full" style={{ background: CATEGORY_COLORS[category] }} />
                {CATEGORY_LABELS[category]}
                <span className="tabular-nums opacity-70">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {shown > 0 ? (
        <div className="rise-in flex flex-col gap-10">
          {areas.map((area) => (
            <section key={area.id ?? "elsewhere"} aria-labelledby={`area-${area.id ?? "elsewhere"}`} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3 border-b pb-2">
                <h2 id={`area-${area.id ?? "elsewhere"}`} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <MapPin className="text-primary size-4 self-center" aria-hidden />
                  {area.name}
                </h2>
                <span className="text-muted-foreground text-sm tabular-nums">{area.events.length}</span>
                {area.id && (
                  <Link
                    href={`/map${mapQuery(base, day, area.id, kind)}`}
                    className="text-muted-foreground hover:text-foreground ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    On the map
                  </Link>
                )}
              </div>
              <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {area.events.map((e) => (
                  <li key={e.id}>
                    <TimelineEvent event={e} hideArea={area.id !== null} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-card/40 flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-14 text-center">
          <CalendarX className="text-muted-foreground size-8" aria-hidden />
          <p className="font-medium">
            {kind && total > 0
              ? `No ${CATEGORY_LABELS[kind].toLowerCase()} on ${formatDay(day)}`
              : `Nothing listed for ${formatDay(day)} yet`}
          </p>
          {kind && total > 0 ? (
            <Link href={`/days/${day}${withKind(base)}`} replace className={chipClass(false)}>
              See all {total} things on that day
            </Link>
          ) : (
            <p className="text-muted-foreground max-w-sm text-sm">Venues add events all the time. Try a day nearby.</p>
          )}
        </div>
      )}

      <AllDay events={allDay} />
    </>
  );
}

function DayStep({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="hover:bg-accent flex size-11 items-center justify-center rounded-full border transition-colors sm:size-9"
    >
      {children}
    </Link>
  );
}

function mapQuery(base: URLSearchParams, day: string, area: string, kind?: EventCategory) {
  const params = new URLSearchParams(withKind(base, kind));
  params.set("from", day);
  params.set("to", day);
  params.set("area", area);
  return `?${params}`;
}

/** The line under the date: how much is on, and how much of the picked kind. */
function summary(total: number, shown: number, kind?: EventCategory) {
  if (total === 0) return "Nothing on in Malmö that matches.";
  const things = total === 1 ? "1 thing" : `${total} things`;
  if (!kind) return `${things} on in Malmö, by area.`;
  return `${CATEGORY_LABELS[kind]}: ${shown} of the ${things} on in Malmö, by area.`;
}

function DaySkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-9 w-72" />
      <div className="flex gap-1.5 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className={cn("h-11 shrink-0 rounded-full sm:h-9", i === 0 ? "w-16" : "w-28")} />
        ))}
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-36" />
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, j) => (
              <Skeleton key={j} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
