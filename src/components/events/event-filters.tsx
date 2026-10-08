"use client";

import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/lib/events/format";
import { parseFilters, WHEN_OPTIONS } from "@/lib/events/filters";
import { EVENT_CATEGORIES } from "@/lib/events/types";

/**
 * Filters live in the URL so results are shareable and rendered on the
 * server. Updates run in a transition to keep the current results visible
 * while the next ones load.
 */
export function EventFilters({ sources }: { sources: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseFilters(Object.fromEntries(searchParams));
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "" || value === "all") next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Debounce free-text search so we don't re-render on every keystroke.
  useEffect(() => {
    if (query.trim() === filters.q) return;
    const id = setTimeout(() => update({ q: query.trim() }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasFilters =
    filters.q || filters.category !== "all" || filters.source !== "all" || filters.when !== "all" || filters.free;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <div className="relative md:w-72">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Search events or venues"
          aria-label="Search events or venues"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={filters.when} onValueChange={(v) => update({ when: v })}>
        <SelectTrigger className="w-full md:w-40" aria-label="Date">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WHEN_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.category} onValueChange={(v) => update({ category: v })}>
        <SelectTrigger className="w-full md:w-48" aria-label="Category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {EVENT_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.source} onValueChange={(v) => update({ source: v })}>
        <SelectTrigger className="w-full md:w-48" aria-label="Source">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          {sources.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={filters.free ? "default" : "outline"}
        aria-pressed={filters.free}
        onClick={() => update({ free: filters.free ? null : "1" })}
      >
        Free only
      </Button>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setQuery("");
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
        >
          <X />
          Clear
        </Button>
      )}

      {isPending && <Loader2 className="text-muted-foreground size-4 animate-spin" aria-label="Updating" />}
    </div>
  );
}

export function EventFiltersFallback() {
  return <div className="h-9" aria-hidden />;
}
