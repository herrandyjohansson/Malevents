"use client";

import { ArrowUpRight, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RemoteImage } from "@/components/events/remote-image";
import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/events/format";
import type { EventCategory } from "@/lib/events/types";
import { cn } from "@/lib/utils";

export interface VenueSummary {
  slug: string;
  name: string;
  address?: string;
  count: number;
  categories: { category: EventCategory; count: number }[];
  imageUrl?: string;
  next?: { title: string; dateLabel: string };
}

type Sort = "busiest" | "name";

export function VenueGrid({ venues }: { venues: VenueSummary[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("busiest");
  const [category, setCategory] = useState<EventCategory | null>(null);
  const q = query.trim().toLowerCase();

  const shown = venues
    .filter((v) => !q || `${v.name} ${v.address ?? ""}`.toLowerCase().includes(q))
    .filter((v) => !category || v.categories.some((c) => c.category === category))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name, "sv") : b.count - a.count));
  const categories = [...new Set(venues.flatMap((v) => v.categories.slice(0, 2).map((c) => c.category)))];

  return (
    <div className="flex flex-col gap-5">
      <div className="glass flex flex-col gap-2.5 rounded-2xl border p-2.5 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a venue"
            aria-label="Find a venue"
            className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full rounded-full border bg-white/[0.04] pr-4 pl-10 text-sm outline-none focus-visible:ring-[3px]"
          />
        </div>
        <div className="no-scrollbar -mx-2.5 flex gap-1.5 overflow-x-auto px-2.5 lg:mx-0 lg:px-0">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(category === c ? null : c)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all active:scale-95",
                category === c ? "text-foreground" : "text-muted-foreground hover:text-foreground bg-white/[0.03]",
              )}
              style={category === c ? { borderColor: CATEGORY_COLORS[c], background: `${CATEGORY_COLORS[c]}30` } : undefined}
            >
              <span aria-hidden>{CATEGORY_EMOJI[c]}</span>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 rounded-full border bg-white/[0.03] p-0.5 text-xs font-medium lg:ml-auto">
          {(["busiest", "name"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sort === s}
              onClick={() => setSort(s)}
              className={cn(
                "h-7 flex-1 rounded-full px-3 transition-colors",
                sort === s ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "busiest" ? "Busiest" : "A–Z"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-sm" aria-live="polite">
        {shown.length === 1 ? "1 venue" : `${shown.length} venues`}
      </p>

      <ul className="rise-in grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((v) => {
          const top = v.categories[0]?.category ?? "other";
          return (
            <li key={v.slug}>
              <Link
                href={`/venues/${v.slug}`}
                className="group bg-card hover:border-white/15 relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-28 overflow-hidden">
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(120% 100% at 0% 0%, ${CATEGORY_COLORS[top]}55, transparent 60%), var(--card)`,
                    }}
                  />
                  {v.imageUrl && (
                    <RemoteImage
                      src={v.imageUrl}
                      className="absolute inset-0 size-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-80"
                    />
                  )}
                  <div aria-hidden className="from-card absolute inset-0 bg-gradient-to-t to-transparent" />
                  <span className="glass absolute top-3 right-3 rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
                    {v.count} upcoming
                  </span>
                </div>
                <div className="relative -mt-6 flex flex-1 flex-col gap-2 px-4 pb-4">
                  <h2 className="flex items-start justify-between gap-2 text-lg leading-snug font-semibold">
                    {v.name}
                    <ArrowUpRight className="text-muted-foreground group-hover:text-foreground mt-1 size-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </h2>
                  {v.address && (
                    <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                      <MapPin className="size-3 shrink-0" />
                      {v.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {v.categories.slice(0, 3).map((c) => (
                      <span
                        key={c.category}
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: `${CATEGORY_COLORS[c.category]}22`, color: CATEGORY_COLORS[c.category] }}
                      >
                        {CATEGORY_LABELS[c.category]} · {c.count}
                      </span>
                    ))}
                  </div>
                  {v.next && (
                    <p className="text-muted-foreground mt-auto border-t border-white/5 pt-2.5 text-xs">
                      <span className="text-foreground/80 font-medium">Next:</span> {v.next.title}
                      <span className="block">{v.next.dateLabel}</span>
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
