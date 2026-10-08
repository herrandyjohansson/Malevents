import { ArrowUpRight, Clock, MapPin, Ticket } from "lucide-react";

import { Card } from "@/components/ui/card";
import { CATEGORY_COLORS, CATEGORY_LABELS, dateParts, formatEventDate, formatPrice } from "@/lib/events/format";
import type { MalmoEvent } from "@/lib/events/types";

export function EventCard({ event, sourceName }: { event: MalmoEvent; sourceName: string }) {
  const price = formatPrice(event);
  const { weekday, day, month } = dateParts(event.startsAt);
  const color = CATEGORY_COLORS[event.category];

  return (
    <Card
      className="group hover:border-primary/40 relative gap-0 overflow-hidden py-0 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_40px_-12px] hover:shadow-primary/30"
      style={{ "--cat": color } as React.CSSProperties}
    >
      <div aria-hidden className="h-1 bg-[var(--cat)] opacity-80" />
      <div className="flex flex-1 gap-4 p-5">
        <div className="bg-secondary flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-center">
          <span className="text-muted-foreground text-[10px] font-medium uppercase">{weekday}</span>
          <span className="text-xl leading-none font-semibold">{day}</span>
          <span className="text-muted-foreground text-[10px] font-medium uppercase">{month}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
            <span aria-hidden className="size-1.5 rounded-full bg-[var(--cat)]" />
            {CATEGORY_LABELS[event.category]}
          </span>
          <h3 className="line-clamp-2 leading-snug font-semibold">
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="after:absolute after:inset-0">
              {event.title}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </h3>
          {event.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">{event.description}</p>
          )}
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
                <dd className="truncate">{event.venue.name}</dd>
              </div>
            )}
            {price && (
              <div className="flex items-center gap-2">
                <dt className="sr-only">Price</dt>
                <Ticket className="size-3.5 shrink-0" />
                <dd className={event.isFree ? "text-success font-medium" : undefined}>{price}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      <div className="text-muted-foreground flex items-center justify-between border-t px-5 py-2.5 text-xs">
        <span className="truncate">via {sourceName}</span>
        <ArrowUpRight className="group-hover:text-primary size-4 transition-colors" />
      </div>
    </Card>
  );
}
