import { CalendarDays, ExternalLink, MapPin, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_GRADIENTS, CATEGORY_LABELS, formatEventDate, formatPrice } from "@/lib/events/format";
import type { MalmoEvent } from "@/lib/events/types";
import { cn } from "@/lib/utils";

export function EventCard({ event, sourceName }: { event: MalmoEvent; sourceName: string }) {
  const price = formatPrice(event);

  return (
    <Card className="group gap-4 overflow-hidden pt-0 transition-shadow hover:shadow-md">
      <div
        className={cn(
          "relative flex h-28 items-end bg-gradient-to-br p-4",
          CATEGORY_GRADIENTS[event.category],
        )}
      >
        {event.imageUrl && (
          // Remote hosts vary per source, so a plain <img> avoids maintaining
          // an images.remotePatterns allowlist for every upstream.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
        )}
        <Badge variant="secondary" className="relative bg-background/90 backdrop-blur">
          {CATEGORY_LABELS[event.category]}
        </Badge>
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2 text-base leading-snug">{event.title}</CardTitle>
        {event.description && (
          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-col gap-1.5 text-sm">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" />
          <time dateTime={event.startsAt}>{formatEventDate(event)}</time>
        </p>
        {event.venue && (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{event.venue.name}</span>
          </p>
        )}
        {price && (
          <p className="flex items-center gap-2">
            <Ticket className="size-4 shrink-0" />
            {price}
          </p>
        )}
      </CardContent>
      <CardFooter className="mt-auto justify-between gap-2">
        <span className="text-muted-foreground truncate text-xs">via {sourceName}</span>
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
        >
          Details
          <ExternalLink className="size-3.5" />
          <span className="sr-only">for {event.title} (opens in a new tab)</span>
        </a>
      </CardFooter>
    </Card>
  );
}
