import { Clock, MapPin } from "lucide-react";
import Link from "next/link";

import { SaveButton } from "@/components/saved/save-button";

import { AREA_NAMES } from "@/lib/events/areas";
import { eventHref } from "@/lib/events/event-href";
import { toFilterable } from "@/lib/events/filters";
import { CATEGORY_COLORS, CATEGORY_LABELS, dateParts, formatEventDate, formatPrice } from "@/lib/events/format";
import type { MalmoEvent } from "@/lib/events/types";
import { toSaved } from "@/lib/saved-snapshot";

import { EventArt } from "./event-art";

export function EventCard({ event, sourceName }: { event: MalmoEvent; sourceName: string }) {
  const price = formatPrice(event);
  const area = toFilterable(event).area;
  const { weekday, day, month } = dateParts(event.startsAt);
  const color = CATEGORY_COLORS[event.category];

  return (
    <article
      className="spotlight-card group bg-card text-card-foreground relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
      style={{ "--cat": color } as React.CSSProperties}
    >
      <div className="relative">
        <EventArt src={event.imageUrl} category={event.category} className="aspect-[16/9]" />
        <div aria-hidden className="from-card absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent" />
        <div className="glass absolute top-3 left-3 flex w-12 flex-col items-center rounded-xl border border-white/10 py-1.5 leading-none shadow-lg">
          <span className="text-muted-foreground text-[10px] font-semibold uppercase">{weekday}</span>
          <span className="mt-0.5 text-lg font-semibold">{day}</span>
          <span className="text-muted-foreground text-[10px] font-semibold uppercase">{month}</span>
        </div>
        {event.cancelled || event.soldOut ? (
          <span className="bg-destructive/90 absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
            {event.cancelled ? "Cancelled" : "Sold out"}
          </span>
        ) : (
          price && (
            <span
              className={
                event.isFree
                  ? "bg-success/90 absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-black shadow-lg"
                  : "glass absolute top-3 right-3 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold shadow-lg"
              }
            >
              {price}
            </span>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pt-2 pb-4">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
          <span aria-hidden className="size-1.5 rounded-full bg-[var(--cat)]" />
          {CATEGORY_LABELS[event.category]}
        </span>
        <h3 className={`line-clamp-2 text-[17px] leading-snug font-semibold ${event.cancelled ? "line-through" : ""}`}>
          <Link href={eventHref(event.id)} className="after:absolute after:inset-0">
            {event.title}
          </Link>
        </h3>
        <dl className="text-muted-foreground mt-auto flex flex-col gap-1 pt-1 text-sm">
          <div className="flex items-center gap-2">
            <dt className="sr-only">When</dt>
            <Clock className="size-3.5 shrink-0" />
            <dd>
              <time dateTime={event.startsAt}>{formatEventDate(event)}</time>
            </dd>
          </div>
          {event.venue && (
            <div className="flex items-center gap-2">
              <dt className="sr-only">Where</dt>
              <MapPin className="size-3.5 shrink-0" />
              <dd className="truncate">
                {event.venue.name}
                {area && <span className="text-muted-foreground/80"> · {AREA_NAMES[area]}</span>}
              </dd>
            </div>
          )}
          {price && (
            <div className="sr-only">
              <dt>Price</dt>
              <dd>{price}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-white/5 px-3 py-2 text-sm sm:text-xs">
        {!event.soldOut && !event.cancelled && event.ticketUrl && (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Tickets on ${sourceName}`}
            className="bg-primary/15 text-primary hover:bg-primary/25 relative z-10 inline-flex h-11 items-center rounded-full px-4 font-medium transition-colors sm:h-8 sm:px-3"
          >
            Tickets
            <span className="sr-only"> for {event.title} on {sourceName} (opens in a new tab)</span>
          </a>
        )}
        <SaveButton event={toSaved(event, price)} className="size-11 sm:size-8" />
      </div>
    </article>
  );
}
