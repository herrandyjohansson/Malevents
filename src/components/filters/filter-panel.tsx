"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

import { RangeCalendar } from "@/components/map/range-calendar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/events/format";
import { DEFAULT_FILTERS, resolveRange, WHEN_OPTIONS, type EventFilters } from "@/lib/events/filters";
import { EVENT_CATEGORIES } from "@/lib/events/types";
import { cn } from "@/lib/utils";

import { SearchBox } from "./search-box";
import type { FilterBarProps } from "./types";

/** Every filter in one place: a bottom sheet on phones, a side panel on desktop. Changes apply at once. */
export function FilterPanel({
  open,
  onOpenChange,
  filters,
  update,
  setFilters,
  isPending,
  showSearch,
  facets,
  sources,
  today,
  lastMonth,
  countFor,
  noun = "events",
}: FilterBarProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EventFilters;
  update: (changes: Partial<EventFilters>) => void;
  setFilters: (filters: EventFilters) => void;
  isPending: boolean;
  showSearch: boolean;
}) {
  const [pickDates, setPickDates] = useState(false);
  const range = resolveRange(filters, today);
  const showCalendar = pickDates || filters.when === "custom";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex items-baseline gap-3 px-5 pt-3 pb-3 md:pt-5">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription className="sr-only">Narrow down the events. Changes apply right away.</SheetDescription>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 pb-6">
          {showSearch && (
            <Section title="Search">
              <SearchBox value={filters.q} onCommit={(q) => update({ q })} />
            </Section>
          )}

          <Section title="When">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {WHEN_OPTIONS.map((o) => {
                const active = filters.when === o.value && !pickDates;
                return (
                  <Tile
                    key={o.value}
                    active={active}
                    onClick={() => {
                      setPickDates(false);
                      update({ when: o.value, from: undefined, to: undefined });
                    }}
                  >
                    {o.label}
                  </Tile>
                );
              })}
              <Tile active={showCalendar} onClick={() => setPickDates(true)} className="col-span-2 sm:col-span-3">
                {filters.when === "custom" && range ? `Dates: ${formatRangeShort(range.from, range.to)}` : "Pick dates…"}
              </Tile>
            </div>
            {showCalendar && (
              <div className="bg-card mt-2 rounded-2xl border p-3">
                <RangeCalendar
                  today={today}
                  lastMonth={lastMonth}
                  value={filters.when === "custom" ? range : null}
                  countFor={countFor}
                  onChange={(r) => update({ when: "custom", from: r.from, to: r.to })}
                />
                <p className="text-muted-foreground mt-1 text-center text-xs">Tap a day, or drag across several.</p>
              </div>
            )}
          </Section>

          <Section title="Category">
            <div className="grid grid-cols-2 gap-1.5">
              {EVENT_CATEGORIES.map((c) => {
                const on = filters.cats.includes(c);
                const n = facets.categories[c] ?? 0;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    disabled={n === 0 && !on}
                    onClick={() => update({ cats: on ? filters.cats.filter((x) => x !== c) : [...filters.cats, c] })}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border p-2.5 text-left text-sm transition-all active:scale-[0.98] disabled:opacity-35",
                      on ? "text-foreground" : "hover:bg-accent/60 bg-white/[0.02]",
                    )}
                    style={on ? { borderColor: CATEGORY_COLORS[c], background: `${CATEGORY_COLORS[c]}26` } : undefined}
                  >
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-base"
                      style={{ background: `${CATEGORY_COLORS[c]}33` }}
                    >
                      {CATEGORY_EMOJI[c]}
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate font-medium">{CATEGORY_LABELS[c]}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">{n}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Options">
            <div className="flex flex-col divide-y rounded-2xl border">
              <label className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  Free only
                  <span className="text-muted-foreground block text-xs">Skip anything that needs a ticket</span>
                </span>
                <Switch checked={filters.free} onCheckedChange={(free) => update({ free })} />
              </label>
              <label className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  Hide exhibitions &amp; multi-day
                  <span className="text-muted-foreground block text-xs">Only events on a single evening or day</span>
                </span>
                <Switch checked={filters.hideLong} onCheckedChange={(hideLong) => update({ hideLong })} />
              </label>
            </div>
          </Section>

          <Section title="Source">
            <ul className="flex flex-col gap-1">
              {sources.map((s) => {
                const on = filters.sources.includes(s.id);
                const n = facets.sources[s.id] ?? 0;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        update({ sources: on ? filters.sources.filter((x) => x !== s.id) : [...filters.sources, s.id] })
                      }
                      className={cn(
                        "hover:bg-accent/60 flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition-colors",
                        on && "bg-primary/10",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          on && "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {on && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">{n}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>

        <div className="flex items-center gap-2 border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            onClick={() => {
              setPickDates(false);
              setFilters(DEFAULT_FILTERS);
            }}
          >
            Clear all
          </Button>
          <Button className="ml-auto min-w-40" onClick={() => onOpenChange(false)}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Show {facets.total} {facets.total === 1 ? noun.replace(/^events/, "event") : noun}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Tile({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-10 rounded-xl border px-3 text-sm font-medium transition-all active:scale-[0.98]",
        active
          ? "border-primary/60 bg-primary/20 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60 bg-white/[0.02]",
        className,
      )}
      {...props}
    />
  );
}

function formatRangeShort(from: string, to: string) {
  const fmt = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;
  return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
}
