"use client";

import { Download, Radio, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** How often live mode re-renders the page with the newest entries. */
const LIVE_INTERVAL_MS = 5000;
/** Radix Select can't hold an empty value, so "every …" is this. */
const ANY = "any";

type Window = "15m" | "1h" | "all";

/**
 * The one filter row for the Logs page. Everything sits in the URL and the
 * server re-renders against it, so the tiles, the table and the stream always
 * agree, and a view can be shared. While the next render loads, the current
 * one stays up.
 */
export function LogFilters({
  window,
  source,
  level,
  event,
  q,
  sources,
  events,
}: {
  window: Window;
  source: string;
  level: string;
  event: string;
  q: string;
  sources: string[];
  events: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(q);
  const live = searchParams.get("live") === "1";

  function set(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Search as you type, a moment after the last key.
  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => set({ q: search.trim() || null }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `set` changes every render; only the text matters
  }, [search]);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => startTransition(() => router.refresh()), LIVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [live, router]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl<Window>
        label="Time window"
        value={window}
        onChange={(w) => set({ window: w === "all" ? null : w })}
        options={[
          { value: "15m", label: "15 min" },
          { value: "1h", label: "1 hour" },
          { value: "all", label: "Since start" },
        ]}
      />
      <Select value={source || ANY} onValueChange={(v) => set({ source: v === ANY ? null : v })}>
        <SelectTrigger className="w-44" aria-label="Source">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Every source</SelectItem>
          {sources.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={level} onValueChange={(v) => set({ level: v === "info" ? null : v })}>
        <SelectTrigger className="w-36" aria-label="Lowest level">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="debug">Debug and up</SelectItem>
          <SelectItem value="info">Info and up</SelectItem>
          <SelectItem value="warn">Warnings and up</SelectItem>
          <SelectItem value="error">Errors only</SelectItem>
        </SelectContent>
      </Select>
      <Select value={event || ANY} onValueChange={(v) => set({ event: v === ANY ? null : v })}>
        <SelectTrigger className="w-48" aria-label="Event">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Every event</SelectItem>
          {events.map((e) => (
            <SelectItem key={e} value={e} className="font-mono text-xs">
              {e}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative min-w-48 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs (URL, error, source…)"
          aria-label="Search logs"
          maxLength={100}
          className="pl-8"
        />
      </div>
      <button
        type="button"
        aria-pressed={live}
        onClick={() => set({ live: live ? null : "1" })}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
          live ? "border-success/40 bg-success/10 text-success" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Radio className={cn("size-4", live && "animate-pulse")} />
        {live ? "Live" : "Go live"}
      </button>
      <a
        href="/admin/logs/download"
        download
        className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium"
      >
        <Download className="size-4" />
        JSONL
      </a>
    </div>
  );
}
