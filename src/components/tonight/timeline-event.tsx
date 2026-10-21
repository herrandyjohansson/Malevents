import { MapPin } from "lucide-react";
import Link from "next/link";

import { EventArt } from "@/components/events/event-art";
import { SaveButton } from "@/components/saved/save-button";
import { AREA_NAMES } from "@/lib/events/areas";
import { eventHref } from "@/lib/events/event-href";
import { toFilterable } from "@/lib/events/filters";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatPrice, formatStartTime } from "@/lib/events/format";
import type { MalmoEvent } from "@/lib/events/types";
import { toSaved } from "@/lib/saved-snapshot";
import { cn } from "@/lib/utils";

/**
 * One row on the Tonight timeline: picture, time, title, place and price,
 * with Tickets and Save. On phones the actions sit on their own line under
 * the text, so the venue never has to be cut short.
 */
export function TimelineEvent({ event, live }: { event: MalmoEvent; live?: boolean }) {
  const price = formatPrice(event);
  const color = CATEGORY_COLORS[event.category];
  const area = toFilterable(event).area;
  const tickets = !event.soldOut && !event.cancelled && event.ticketUrl;

  return (
    <article
      className="group bg-card/70 hover:bg-card relative flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border p-2.5 transition-colors hover:border-white/15 sm:flex-nowrap sm:gap-x-4"
      style={{ "--cat": color } as React.CSSProperties}
    >
      <EventArt
        src={event.imageUrl}
        category={event.category}
        className="size-20 shrink-0 rounded-xl sm:h-20 sm:w-28"
        emojiClassName="text-3xl"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="flex flex-wrap items-center gap-1.5 text-xs font-medium" style={{ color }}>
          {live && (
            <span className="bg-destructive/90 mr-1 flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-bold tracking-wide text-white uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          )}
          {formatStartTime(event)} · {CATEGORY_LABELS[event.category]}
        </span>
        <h3 className={cn("line-clamp-2 leading-snug font-semibold", event.cancelled && "line-through")}>
          <Link href={eventHref(event.id)} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>
        {event.venue && (
          <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
            <MapPin className="mt-px size-3 shrink-0" aria-hidden />
            <span>
              {event.venue.name}
              {area && ` · ${AREA_NAMES[area]}`}
              {price && <span className={cn(event.isFree && "text-success font-medium")}> · {price}</span>}
            </span>
          </p>
        )}
      </div>
      {/* With a Tickets button the actions get their own line on phones; a lone heart stays beside the text. */}
      <div className={cn("flex items-center justify-end gap-2 sm:w-auto", tickets && "w-full")}>
        {tickets && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary/15 text-primary hover:bg-primary/25 relative z-10 inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors sm:h-9 sm:px-3 sm:text-xs"
          >
            Tickets
            <span className="sr-only"> for {event.title} (opens in a new tab)</span>
          </a>
        )}
        {(event.soldOut || event.cancelled) && (
          <span className="text-destructive text-xs font-medium">{event.cancelled ? "Cancelled" : "Sold out"}</span>
        )}
        <SaveButton event={toSaved(event, price)} className="size-11 sm:size-9" />
      </div>
    </article>
  );
}
