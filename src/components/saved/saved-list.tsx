"use client";

import { CalendarPlus, Download, Heart, MapPin, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { EventArt } from "@/components/events/event-art";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDay } from "@/lib/days";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatEventDate } from "@/lib/events/format";
import { localDay } from "@/lib/events/malmo-time";
import { downloadIcs, type IcsEvent } from "@/lib/ics";
import { removeSaved, useSavedEvents, type SavedEvent } from "@/lib/saved";

import { SaveButton } from "./save-button";

const subscribeNothing = () => () => {};

function toIcs(e: SavedEvent): IcsEvent {
  return {
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    allDay: e.timeUnknown,
    location: [e.venueName, e.venueAddress].filter(Boolean).join(", ") || undefined,
    url: e.url,
  };
}

function fileName(title: string) {
  return `${title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "event"}.ics`;
}

export function SavedList() {
  // Saved events live in this browser, so the server renders a placeholder.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  return hydrated ? <SavedContent /> : <SavedSkeleton />;
}

function SavedContent() {
  const saved = useSavedEvents();
  // Fixed for the visit, so what counts as "past" doesn't shift while you look.
  const [now] = useState(() => Date.now());

  const isOver = (e: SavedEvent) =>
    (e.endsAt ? Date.parse(e.endsAt) : Date.parse(e.startsAt) + 3 * 3_600_000) < now;
  const upcoming = saved.filter((e) => !isOver(e)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = saved.filter(isOver).sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  if (saved.length === 0) {
    return (
      <div className="bg-card/40 flex flex-col items-center gap-4 rounded-3xl border border-dashed px-6 py-16 text-center">
        <span className="bg-primary/15 text-primary flex size-16 items-center justify-center rounded-full shadow-[0_0_40px_-8px] shadow-primary">
          <Heart className="size-7" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold">Nothing saved yet</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Tap the heart on any event to keep it here. Your list stays in this browser, no account needed.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Sparkles />
            Find something to do
          </Link>
        </Button>
      </div>
    );
  }

  // Group upcoming events under their Malmö day.
  const days = new Map<string, SavedEvent[]>();
  for (const e of upcoming) {
    const day = localDay(new Date(e.startsAt));
    days.set(day, [...(days.get(day) ?? []), e]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground mr-auto text-sm">
          <span className="text-foreground font-semibold">{upcoming.length}</span> coming up
          {past.length > 0 && ` · ${past.length} past`}
        </p>
        {upcoming.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => downloadIcs(upcoming.map(toIcs), "malevents-saved.ics")}>
            <Download />
            Add all to calendar
          </Button>
        )}
      </div>

      {upcoming.length === 0 && (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm">
          Everything you saved has happened.{" "}
          <Link href="/" className="text-primary hover:underline">
            Find something new
          </Link>
          .
        </p>
      )}

      {[...days.entries()].map(([day, list]) => (
        <section key={day} className="flex flex-col gap-2.5">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{formatDay(day)}</h2>
          <ul className="rise-in flex flex-col gap-2.5">
            {list.map((e) => (
              <li key={e.id}>
                <SavedRow event={e} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {past.length > 0 && (
        <details className="group bg-card/40 rounded-2xl border">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
            Past events ({past.length})
            <span className="text-muted-foreground ml-auto text-xs group-open:hidden">Show</span>
            <span className="text-muted-foreground ml-auto hidden text-xs group-open:inline">Hide</span>
          </summary>
          <div className="flex flex-col gap-2.5 p-2.5 pt-0">
            <ul className="flex flex-col gap-2.5 opacity-70">
              {past.map((e) => (
                <li key={e.id}>
                  <SavedRow event={e} past />
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground self-end"
              onClick={() => removeSaved(past.map((e) => e.id))}
            >
              <Trash2 />
              Clear past events
            </Button>
          </div>
        </details>
      )}
    </div>
  );
}

function SavedRow({ event: e, past }: { event: SavedEvent; past?: boolean }) {
  const color = CATEGORY_COLORS[e.category];
  return (
    <article className="group bg-card/70 hover:bg-card relative flex gap-3 rounded-2xl border p-2.5 transition-colors hover:border-white/15 sm:gap-4">
      <EventArt src={e.imageUrl} category={e.category} className="size-20 shrink-0 rounded-xl sm:h-20 sm:w-28" emojiClassName="text-3xl" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="text-xs font-medium" style={{ color }}>
          {formatEventDate(e)} ·{" "}
          {CATEGORY_LABELS[e.category]}
        </span>
        <h3 className="line-clamp-2 leading-snug font-semibold">
          <a href={e.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0">
            {e.title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </h3>
        <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
          {e.venueName && (
            <>
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{e.venueName}</span>
            </>
          )}
          {e.priceLabel && <span className={e.isFree ? "text-success shrink-0 font-medium" : "shrink-0"}>· {e.priceLabel}</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 self-center">
        {!past && e.ticketUrl && (
          <a
            href={e.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary/15 text-primary hover:bg-primary/25 relative z-10 mr-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors max-sm:hidden"
          >
            Tickets
          </a>
        )}
        {!past && (
          <button
            type="button"
            onClick={() => downloadIcs([toIcs(e)], fileName(e.title))}
            aria-label={`Add ${e.title} to your calendar`}
            title="Add to calendar"
            className="text-muted-foreground hover:text-foreground relative z-10 flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <CalendarPlus className="size-4" />
          </button>
        )}
        <SaveButton event={e} />
      </div>
    </article>
  );
}

function SavedSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
  );
}
