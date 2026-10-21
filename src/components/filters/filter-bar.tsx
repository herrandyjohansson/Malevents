"use client";

import { CalendarDays, Loader2, Moon, SlidersHorizontal, Sparkles, Sun, X } from "lucide-react";
import { useState } from "react";

import { RangeCalendar } from "@/components/map/range-calendar";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import { formatRange } from "@/lib/days";
import { AREAS, type AreaId } from "@/lib/events/areas";
import { CATEGORY_LABELS } from "@/lib/events/format";
import { activeFilterCount, hasActiveFilters, resolveRange, type When } from "@/lib/events/filters";
import { cn } from "@/lib/utils";

import { FilterPanel } from "./filter-panel";
import { SearchBox } from "./search-box";
import type { FilterBarProps } from "./types";
import { useFilters } from "./use-filters";

const QUICK_WHEN: { value: When; label: string; icon: typeof Sun }[] = [
  { value: "tonight", label: "Tonight", icon: Moon },
  { value: "today", label: "Today", icon: Sun },
  { value: "weekend", label: "This weekend", icon: Sparkles },
  { value: "week", label: "Next 7 days", icon: CalendarDays },
];

/** A chip: 44px tall on phones (thumb-sized), 36px from `sm` up. */
export const chipClass = (active: boolean) =>
  cn(
    "flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors sm:h-9 sm:px-3 sm:text-xs",
    active
      ? "border-primary/60 bg-primary/20 text-foreground"
      : "text-muted-foreground hover:text-foreground bg-white/[0.03] hover:border-white/20",
  );

export function FilterBar(props: FilterBarProps) {
  return props.variant === "floating" ? <FloatingFilters {...props} /> : <InlineFilters {...props} />;
}

/** One row of chips over the phone map; everything else lives in the filter panel. */
function FloatingFilters(props: FilterBarProps) {
  const { mode, today, className, defaultWhen } = props;
  const { filters, defaults, update, setFilters, isPending } = useFilters(mode, defaultWhen);
  const [panelOpen, setPanelOpen] = useState(false);
  const count = activeFilterCount(filters, defaultWhen);
  const range = resolveRange(filters, today);

  const chip = (active: boolean) => cn(chipClass(active), "shadow-lg backdrop-blur-md", !active && "bg-background/85");

  return (
    <div className={cn("no-scrollbar flex gap-1.5 overflow-x-auto", className)}>
      <button type="button" onClick={() => setPanelOpen(true)} className={cn(chip(count > 0), "pr-2.5")}>
        <SlidersHorizontal className="size-4 sm:size-3.5" />
        Filters
        {count > 0 && (
          <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-[11px] font-bold">
            {count}
          </span>
        )}
      </button>
      {QUICK_WHEN.map(({ value, label, icon: Icon }) => {
        const active = filters.when === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => update({ when: active ? "all" : value, from: undefined, to: undefined })}
            className={chip(active)}
          >
            <Icon className="size-4 sm:size-3.5" />
            {label}
          </button>
        );
      })}
      {filters.when === "custom" && range && (
        <button type="button" aria-pressed onClick={() => setPanelOpen(true)} className={chip(true)} title="Change dates">
          <CalendarDays className="size-4 sm:size-3.5" />
          {formatRange(range)}
        </button>
      )}
      <FilterPanel
        {...props}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        filters={filters}
        defaults={defaults}
        update={update}
        setFilters={setFilters}
        isPending={isPending}
        showSearch
      />
    </div>
  );
}

const WHEN_SEGMENTS: SegmentOption<When>[] = [
  { value: "all", label: "Any time" },
  { value: "tonight", label: "Tonight", icon: Moon },
  { value: "today", label: "Today", icon: Sun },
  { value: "weekend", label: "This weekend", icon: Sparkles },
  { value: "week", label: "Next 7 days" },
];

/**
 * The bar above Discover's list and the calendar: when and where up front,
 * everything else (kind of event, free, exhibitions, sources) one tap away
 * in the filter panel. Active panel filters show as chips you can remove.
 */
function InlineFilters(props: FilterBarProps) {
  const { mode, facets, today, lastMonth, countFor, datePicker = true, noun = "events", className, defaultWhen } = props;
  const { filters, defaults, update, setFilters, isPending } = useFilters(mode, defaultWhen);
  const [datesOpen, setDatesOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const range = resolveRange(filters, today);
  const custom = filters.when === "custom" && range;
  const panelCount = filters.cats.length + filters.sources.length + Number(filters.free) + Number(filters.hideLong);

  // "30 days" lives in the panel; when it's picked, show it here too so the bar tells the truth.
  const extra: SegmentOption<When>[] = filters.when === "month" ? [{ value: "month", label: "Next 30 days" }] : [];
  const segments: SegmentOption<When>[] = [
    ...WHEN_SEGMENTS,
    ...extra,
    ...(datePicker || custom
      ? [{ value: "custom" as const, label: custom ? formatRange(range) : "Pick dates", icon: CalendarDays }]
      : []),
  ];

  function pickWhen(when: When) {
    if (when === "custom") {
      if (datePicker) setDatesOpen((open) => !open || !custom);
      return;
    }
    setDatesOpen(false);
    update({ when, from: undefined, to: undefined });
  }

  function toggleArea(id: AreaId) {
    const on = filters.areas.includes(id);
    update({ areas: on ? filters.areas.filter((a) => a !== id) : [...filters.areas, id] });
  }

  const removable: { key: string; label: string; remove: () => void }[] = [
    // The search box is in the panel on phones, so an active search shows here too.
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”`, remove: () => update({ q: "" }) }] : []),
    ...filters.cats.map((c) => ({
      key: `cat-${c}`,
      label: CATEGORY_LABELS[c],
      remove: () => update({ cats: filters.cats.filter((x) => x !== c) }),
    })),
    ...(filters.free ? [{ key: "free", label: "Free", remove: () => update({ free: false }) }] : []),
    ...(filters.hideLong
      ? [{ key: "nolong", label: "No exhibitions", remove: () => update({ hideLong: false }) }]
      : []),
    ...(filters.sources.length
      ? [
          {
            key: "src",
            label: `${filters.sources.length} ${filters.sources.length === 1 ? "listing site" : "listing sites"}`,
            remove: () => update({ sources: [] }),
          },
        ]
      : []),
  ];

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <SegmentedControl
          label="When"
          options={segments}
          value={datesOpen ? "custom" : filters.when}
          onChange={pickWhen}
          className="min-w-0 lg:flex-1"
        />
        <div className="hidden lg:block lg:w-80 lg:shrink-0">
          <SearchBox value={filters.q} onCommit={(q) => update({ q })} />
        </div>
      </div>

      {datePicker && (
        <Reveal open={datesOpen}>
          <div className="bg-card/60 mx-auto w-full max-w-sm rounded-2xl border p-3">
            <RangeCalendar
              today={today}
              lastMonth={lastMonth}
              value={custom ? range : null}
              countFor={countFor}
              onChange={(r) => update({ when: "custom", from: r.from, to: r.to })}
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">Tap a day, or drag across several.</p>
              <Button size="sm" variant="ghost" onClick={() => setDatesOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Reveal>
      )}

      <div className="flex items-center gap-1.5">
        <ul className="fade-edges no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1" aria-label="Areas">
          {AREAS.filter((a) => facets.areas[a.id] || filters.areas.includes(a.id)).map((a) => {
            const on = filters.areas.includes(a.id);
            const n = facets.areas[a.id] ?? 0;
            return (
              <li key={a.id} className="shrink-0">
                <button type="button" aria-pressed={on} onClick={() => toggleArea(a.id)} className={chipClass(on)}>
                  {a.name}
                  <span className={cn("tabular-nums", on ? "text-foreground/70" : "text-muted-foreground/80")}>{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className={cn(chipClass(panelCount > 0), "pr-2.5")}
          aria-label={panelCount ? `Filters, ${panelCount} on` : "Filters"}
        >
          <SlidersHorizontal className="size-4 sm:size-3.5" />
          <span className="max-sm:sr-only">Filters</span>
          {panelCount > 0 && (
            <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-[11px] font-bold">
              {panelCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {removable.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={r.remove}
            className="border-primary/40 bg-primary/10 hover:bg-primary/20 flex h-8 items-center gap-1 rounded-full border pr-2 pl-3 font-medium transition-colors"
          >
            {r.label}
            <X className="size-3.5" aria-hidden />
            <span className="sr-only">(remove)</span>
          </button>
        ))}
        <p className="text-muted-foreground ml-auto flex items-center gap-1.5 px-1" aria-live="polite">
          {isPending && <Loader2 className="size-3.5 animate-spin" aria-label="Updating" />}
          <span className="text-foreground font-semibold tabular-nums">{facets.total}</span>{" "}
          {facets.total === 1 ? noun.replace(/^events/, "event") : noun}
        </p>
        {hasActiveFilters(filters, defaultWhen) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 gap-1 px-2 text-xs"
            onClick={() => {
              setDatesOpen(false);
              setFilters(defaults);
            }}
          >
            <X className="size-3.5" />
            Clear all
          </Button>
        )}
      </div>

      <FilterPanel
        {...props}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        filters={filters}
        defaults={defaults}
        update={update}
        setFilters={setFilters}
        isPending={isPending}
        showSearch
      />
    </div>
  );
}

/** Folds content open in place; height animates through a grid row. */
function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

