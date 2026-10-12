import { EventArt } from "@/components/events/event-art";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatEventDate } from "@/lib/events/format";
import type { MalmoEvent } from "@/lib/events/types";

import { ScrollButtons } from "./scroll-buttons";

const REEL_ID = "week-reel";

/**
 * A coverflow of picks: cards tilt away on either side and face you in the
 * middle. The tilt is a CSS scroll-driven animation (.coverflow-item), so it
 * needs no JavaScript; browsers without it show a flat, snapping row.
 */
export function HighlightReel({ events }: { events: MalmoEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section aria-labelledby="reel-heading" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="reel-heading" className="text-lg font-semibold">
            Picks for the week
          </h2>
          <p className="text-muted-foreground text-sm">One of each kind, soonest first.</p>
        </div>
        <ScrollButtons targetId={REEL_ID} label="picks" />
      </div>
      <ul
        id={REEL_ID}
        className="coverflow no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1rem,calc(50%-6.5rem))] py-4 sm:-mx-6 sm:px-[max(1.5rem,calc(50%-8.5rem))]"
      >
        {events.map((event) => {
          const color = CATEGORY_COLORS[event.category];
          return (
            <li key={event.id} className="coverflow-item w-52 shrink-0 sm:w-[17rem] snap-center">
              <article
                className="group bg-card relative overflow-hidden rounded-2xl border transition-colors hover:border-white/15"
                style={{ boxShadow: `0 24px 60px -28px ${color}` }}
              >
                <EventArt src={event.imageUrl} category={event.category} className="aspect-[4/5]" />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
                    <span aria-hidden className="size-1.5 rounded-full" style={{ background: color }} />
                    {CATEGORY_LABELS[event.category]}
                  </span>
                  <h3 className="line-clamp-2 text-lg leading-snug font-semibold text-white">
                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0">
                      {event.title}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </h3>
                  <p className="text-sm text-white/70">
                    <time dateTime={event.startsAt}>{formatEventDate(event)}</time>
                    {event.venue && <> · {event.venue.name}</>}
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
