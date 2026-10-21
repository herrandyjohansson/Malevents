import { ArrowUpRight, Ban, Clock, MapPin, Navigation, Ticket } from "lucide-react";
import Link from "next/link";

import { SheetTitle } from "@/components/ui/sheet";
import { eventHref } from "@/lib/events/event-href";
import type { EventDetail as Detail } from "@/lib/events/event-detail";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatEventDate,
  formatEventDateLong,
  formatPrice,
} from "@/lib/events/format";
import { toSaved } from "@/lib/saved-snapshot";
import { cn } from "@/lib/utils";

import { EventActions } from "./event-actions";
import { EventArt } from "./event-art";

/**
 * The description, unless it is only the listing site's page summary
 * ("Lunchgalopp … den 21 oktober - Tickster.com"), which tells a visitor nothing.
 */
function usefulDescription(text: string | undefined) {
  if (!text || /-\s*tickster\.com\s*$/i.test(text)) return undefined;
  return text;
}

/** Free, keyless directions: hands the coordinates to the visitor's maps app or Google Maps in the browser. */
function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Everything needed to decide on an event and act on it. Shared by the full
 * page (`/events/[id]`) and the sheet that opens over a list; `inSheet`
 * makes the title the sheet's accessible name.
 */
export function EventDetail({ detail, inSheet = false }: { detail: Detail; inSheet?: boolean }) {
  const { event, sourceName, areaName, ended, moreAtVenue } = detail;
  const price = formatPrice(event);
  const color = CATEGORY_COLORS[event.category];
  const venue = event.venue;
  const hasPlace = venue?.lat !== undefined && venue?.lng !== undefined;
  const buyable = !event.cancelled && !event.soldOut && !ended;
  const primary = buyable && event.ticketUrl ? { href: event.ticketUrl, label: `Tickets on ${sourceName}` } : { href: event.url, label: `Event page on ${sourceName}` };
  const Title = inSheet ? SheetTitle : "h1";
  const description = usefulDescription(event.description);

  return (
    <article className="flex flex-col gap-6">
      <EventArt src={event.imageUrl} category={event.category} className="aspect-[16/9] rounded-2xl border" />

      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color }}>
          <span aria-hidden className="size-2 rounded-full" style={{ background: color }} />
          {CATEGORY_LABELS[event.category]}
        </p>
        <Title
          className={cn(
            "text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl",
            event.cancelled && "line-through decoration-2",
          )}
        >
          {event.title}
        </Title>
        {(event.cancelled || event.soldOut || ended) && (
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              event.cancelled || event.soldOut ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Ban className="size-4" aria-hidden />
            {event.cancelled
              ? "Cancelled by the organiser"
              : event.soldOut
                ? "Sold out"
                : "This event has ended"}
          </p>
        )}
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm sm:gap-x-6">
        <dt className="text-muted-foreground flex items-center gap-2">
          <Clock className="size-4" aria-hidden />
          When
        </dt>
        <dd className="font-medium">
          <time dateTime={event.startsAt}>{formatEventDateLong(event)}</time>
          {event.timeUnknown && <span className="text-muted-foreground block font-normal">Start time not announced yet</span>}
        </dd>
        {venue && (
          <>
            <dt className="text-muted-foreground flex items-center gap-2">
              <MapPin className="size-4" aria-hidden />
              Where
            </dt>
            <dd>
              <span className="font-medium">{venue.name}</span>
              {(areaName || venue.address) && (
                <span className="text-muted-foreground block">
                  {[venue.address, areaName].filter(Boolean).join(" · ")}
                </span>
              )}
              {!hasPlace && <span className="text-muted-foreground block">The exact location isn&apos;t known.</span>}
            </dd>
          </>
        )}
        {price && (
          <>
            <dt className="text-muted-foreground flex items-center gap-2">
              <Ticket className="size-4" aria-hidden />
              Price
            </dt>
            <dd className="font-medium">{price}</dd>
          </>
        )}
      </dl>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <a
            href={primary.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors sm:flex-none"
          >
            {primary.label}
            <ArrowUpRight className="size-4" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          {hasPlace && (
            <a
              href={directionsUrl(venue.lat!, venue.lng!)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-accent inline-flex h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors"
            >
              <Navigation className="size-4" aria-hidden />
              Directions
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
        <EventActions
          saved={toSaved(event, price)}
          ics={{
            id: event.id,
            title: event.title,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            allDay: event.timeUnknown,
            location: [venue?.name, venue?.address].filter(Boolean).join(", ") || undefined,
            url: event.url,
          }}
        />
      </div>

      {(description || event.notes?.length) && (
        <section aria-label="About this event" className="flex flex-col gap-3">
          {description && <p className="max-w-[65ch] leading-relaxed whitespace-pre-line">{description}</p>}
          {event.notes?.length ? (
            <ul className="text-muted-foreground flex flex-wrap gap-2 text-sm">
              {event.notes.map((n) => (
                <li key={n} className="rounded-full border px-3 py-1">
                  {n}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}

      {moreAtVenue.length > 0 && venue && (
        <section aria-labelledby="more-at-venue" className="flex flex-col gap-3 border-t pt-6">
          <h2 id="more-at-venue" className="text-base font-semibold">
            More at {venue.name}
          </h2>
          <ul className="flex flex-col gap-1">
            {moreAtVenue.map((e) => (
              <li key={e.id}>
                <Link
                  href={eventHref(e.id)}
                  replace={inSheet}
                  className="hover:bg-accent -mx-2 flex items-baseline justify-between gap-4 rounded-lg px-2 py-2.5"
                >
                  <span className={cn("font-medium", e.cancelled && "line-through")}>{e.title}</span>
                  <span className="text-muted-foreground shrink-0 text-sm">{formatEventDate(e)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-muted-foreground text-xs">Listing from {sourceName}. Details can change; check before you go.</p>
    </article>
  );
}
