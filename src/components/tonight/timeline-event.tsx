import { MapPin } from "lucide-react";

import { EventArt } from "@/components/events/event-art";
import { SaveButton } from "@/components/saved/save-button";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatPrice, formatStartTime } from "@/lib/events/format";
import type { MalmoEvent } from "@/lib/events/types";
import { toSaved } from "@/lib/saved-snapshot";
import { cn } from "@/lib/utils";

/** One row on the Tonight timeline: thumbnail, title, place and price, with a tickets link. */
export function TimelineEvent({ event, live }: { event: MalmoEvent; live?: boolean }) {
  const price = formatPrice(event);
  const color = CATEGORY_COLORS[event.category];
  return (
    <article
      className="group bg-card/70 hover:bg-card relative flex gap-3 rounded-2xl border p-2.5 transition-colors hover:border-white/15 sm:gap-4"
      style={{ "--cat": color } as React.CSSProperties}
    >
      <EventArt
        src={event.imageUrl}
        category={event.category}
        className="size-20 shrink-0 rounded-xl sm:h-20 sm:w-28"
        emojiClassName="text-3xl"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
          {live && (
            <span className="bg-destructive/90 mr-1 flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-bold tracking-wide text-white uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          )}
          {formatStartTime(event)} · {CATEGORY_LABELS[event.category]}
        </span>
        <h3 className="line-clamp-2 leading-snug font-semibold">
          <a href={event.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0">
            {event.title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </h3>
        <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
          {event.venue && (
            <>
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{event.venue.name}</span>
            </>
          )}
          {price && <span className={cn("shrink-0", event.isFree && "text-success font-medium")}>· {price}</span>}
        </p>
      </div>
      {!event.soldOut && event.ticketUrl && (
        <a
          href={event.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary/15 text-primary hover:bg-primary/25 relative z-10 self-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors max-sm:hidden"
        >
          Tickets
          <span className="sr-only"> for {event.title} (opens in a new tab)</span>
        </a>
      )}
      {event.soldOut && (
        <span className="text-destructive self-center text-xs font-medium max-sm:hidden">Sold out</span>
      )}
      <SaveButton event={toSaved(event, price)} className="self-center" />
    </article>
  );
}
