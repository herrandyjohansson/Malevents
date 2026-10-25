"use client";

import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { SearchBox } from "@/components/filters/search-box";
import { RemoteImage } from "@/components/events/remote-image";
import { PendingSources } from "@/components/events/pending-sources";
import { Button } from "@/components/ui/button";
import { createEventSearch, searchEvents, type SearchDocument } from "@/lib/events/search";
import { CATEGORY_COLORS, CATEGORY_LABELS, dateParts } from "@/lib/events/format";
import { useUrlParam } from "@/lib/use-url-param";

export function TonightSearch({
  documents,
  pending,
  children,
}: {
  documents: SearchDocument[];
  pending: string[];
  children: ReactNode;
}) {
  const [value, setQuery] = useUrlParam("q");
  const query = (value ?? "").trim().slice(0, 100);
  const search = useMemo(() => createEventSearch(documents), [documents]);
  const results = useMemo(() => searchEvents(search, query), [search, query]);

  return (
    <>
      <div className="w-full">
        <SearchBox
          value={query}
          onCommit={(text) => setQuery(text.slice(0, 100))}
          placeholder="Search events & venues · all dates"
        />
      </div>
      {query ? (
        <section aria-label="Search results" className="flex flex-col gap-6">
          <PendingSources names={pending} />
          <p role="status" className="text-muted-foreground text-sm">
            {results.length === 0 ? `No events or venues found for “${query}”. Try another name or keyword.` : (
              `${results.filter((result) => result.kind === "event").length} events and ${results.filter((result) => result.kind === "venue").length} venues found for “${query}”.`
            )}
          </p>
          <ResultList key={`venues:${query}`} title="Venues" results={results.filter((result) => result.kind === "venue")} />
          <ResultList key={`events:${query}`} title="Events" results={results.filter((result) => result.kind === "event")} />
        </section>
      ) : children}
    </>
  );
}

function ResultList({ title, results }: { title: string; results: SearchDocument[] }) {
  const [visible, setVisible] = useState(20);
  if (!results.length) return null;
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {title === "Venues" ? <MapPin className="text-primary size-4" aria-hidden /> : <CalendarDays className="text-primary size-4" aria-hidden />}
        {title} <span className="text-muted-foreground text-sm font-normal">({results.length})</span>
      </h2>
      <ul className="divide-y border-y">
        {results.slice(0, visible).map((result) => (
          <li key={result.id} className="py-4">
            <SearchResult result={result} />
          </li>
        ))}
      </ul>
      {visible < results.length && (
        <Button variant="outline" className="self-start" onClick={() => setVisible((count) => count + 20)}>
          Show more {title.toLowerCase()}
        </Button>
      )}
    </section>
  );
}

function SearchResult({ result }: { result: SearchDocument }) {
  const venue = result.kind === "venue";
  const date = result.startsAt ? dateParts(result.startsAt) : null;
  return (
    <article className="group">
      <Link
        href={result.href}
        className="focus-visible:ring-ring flex items-start gap-3 rounded-xl outline-none focus-visible:ring-2 sm:gap-4"
      >
        <div aria-hidden className="bg-card text-muted-foreground relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border sm:h-24 sm:w-32">
          {venue ? <MapPin className="size-6" /> : <CalendarDays className="size-6" />}
          {result.imageUrl && <RemoteImage key={result.imageUrl} src={result.imageUrl} className="absolute inset-0 size-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          {!venue && result.category && (
            <p className="mb-1 text-xs font-medium" style={{ color: CATEGORY_COLORS[result.category] }}>
              {CATEGORY_LABELS[result.category]}
              {result.price && <span className="text-muted-foreground"> · {result.price}</span>}
            </p>
          )}
          <h3 className={`group-hover:text-primary text-base leading-snug font-semibold break-words transition-colors sm:text-lg ${result.status === "Cancelled" ? "line-through" : ""}`}>
            {result.title}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed break-words sm:text-sm">{result.subtitle}</p>
          {result.status && <p className="text-destructive mt-1 text-xs font-medium">{result.status}</p>}
        </div>
        {date && (
          <div aria-hidden className="hidden w-10 shrink-0 pt-1 text-center leading-none sm:block">
            <span className="text-muted-foreground text-[10px] font-medium uppercase">{date.weekday}</span>
            <span className="my-1 block text-2xl font-semibold tabular-nums">{date.day}</span>
            <span className="text-muted-foreground text-[10px] uppercase">{date.month}</span>
          </div>
        )}
        {venue && <ArrowUpRight className="text-muted-foreground group-hover:text-primary mt-1 size-4 shrink-0" aria-hidden />}
      </Link>
      {venue && result.upcoming && result.upcoming.length > 0 && (
        <ul aria-label={`Next at ${result.title}`} className="mt-3 space-y-1 sm:ml-36">
          {result.upcoming.map((event) => (
            <li key={event.href}>
              <Link
                href={event.href}
                className="text-muted-foreground hover:text-foreground hover:bg-accent/50 focus-visible:ring-ring flex min-h-11 flex-col justify-center gap-0.5 rounded-lg px-2 py-1.5 text-xs outline-none focus-visible:ring-2 sm:flex-row sm:items-baseline sm:justify-start sm:gap-3"
              >
                <span className="shrink-0 tabular-nums">{event.date}</span>
                <span className="text-foreground min-w-0 truncate font-medium">{event.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
