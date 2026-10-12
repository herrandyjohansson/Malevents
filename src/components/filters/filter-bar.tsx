"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  Layers,
  Loader2,
  Moon,
  Radio,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Ticket,
  X,
} from "lucide-react";
import { useState } from "react";

import { RangeCalendar } from "@/components/map/range-calendar";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import { formatRange } from "@/lib/days";
import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/events/format";
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  hasActiveFilters,
  resolveRange,
  type EventFilters,
  type Facets,
  type When,
} from "@/lib/events/filters";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/events/types";
import { cn } from "@/lib/utils";

import { FilterPanel } from "./filter-panel";
import { SearchBox } from "./search-box";
import type { FilterBarProps } from "./types";
import { useFilters } from "./use-filters";

const QUICK_WHEN: { value: When; label: string; icon: typeof Sun }[] = [
  { value: "today", label: "Today", icon: Sun },
  { value: "tonight", label: "Tonight", icon: Moon },
  { value: "weekend", label: "This weekend", icon: Sparkles },
  { value: "week", label: "Next 7 days", icon: CalendarDays },
];

export function FilterBar(props: FilterBarProps) {
  return props.variant === "floating" ? <FloatingFilters {...props} /> : <InlineFilters {...props} />;
}

/** One row of chips over the phone map; everything else lives in the filter panel. */
function FloatingFilters(props: FilterBarProps) {
  const { mode, today, className } = props;
  const { filters, update, setFilters, isPending } = useFilters(mode);
  const [panelOpen, setPanelOpen] = useState(false);
  const count = activeFilterCount(filters);
  const range = resolveRange(filters, today);

  const chip = (active: boolean) =>
    cn(
      "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap shadow-lg backdrop-blur-md transition-all active:scale-95",
      active
        ? "border-primary/60 bg-primary/35 text-foreground shadow-[0_0_16px_-6px] shadow-primary"
        : "text-muted-foreground hover:text-foreground bg-background/80 hover:border-white/20",
    );

  const filtersButton = (
    <button type="button" onClick={() => setPanelOpen(true)} className={cn(chip(count > 0), "pr-2.5")}>
      <SlidersHorizontal className="size-3.5" />
      Filters
      {count > 0 && (
        <span className="bg-primary text-primary-foreground flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold">
          {count}
        </span>
      )}
    </button>
  );

  const quickChips = (
    <>
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
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
      {filters.when === "custom" && range && (
        <button
          type="button"
          aria-pressed
          onClick={() => setPanelOpen(true)}
          className={chip(true)}
          title="Change dates"
        >
          <CalendarDays className="size-3.5" />
          {formatRange(range)}
        </button>
      )}
      <button
        type="button"
        aria-pressed={filters.free}
        onClick={() => update({ free: !filters.free })}
        className={chip(filters.free)}
      >
        <Ticket className="size-3.5" />
        Free
      </button>
    </>
  );

  const panel = (
    <FilterPanel
      {...props}
      open={panelOpen}
      onOpenChange={setPanelOpen}
      filters={filters}
      update={update}
      setFilters={setFilters}
      isPending={isPending}
      showSearch
    />
  );

  return (
    <div className={cn("no-scrollbar flex gap-1.5 overflow-x-auto", className)}>
      {filtersButton}
      {quickChips}
      {panel}
    </div>
  );
}

const WHEN_SEGMENTS: SegmentOption<When>[] = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today", icon: Sun },
  { value: "tonight", label: "Tonight", icon: Moon },
  { value: "weekend", label: "Weekend", icon: Sparkles },
  { value: "week", label: "7 days" },
  { value: "month", label: "30 days" },
];

/**
 * The page-top bar: every choice is a button you can see and tap, no
 * dropdowns or pop-ups. Dates and sources fold open in place.
 */
function InlineFilters({
  mode,
  facets,
  sources,
  today,
  lastMonth,
  countFor,
  datePicker = true,
  noun = "events",
  className,
}: FilterBarProps) {
  const { filters, update, setFilters, isPending } = useFilters(mode);
  const [datesOpen, setDatesOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const range = resolveRange(filters, today);
  const custom = filters.when === "custom" && range;

  const segments: SegmentOption<When>[] =
    datePicker || custom
      ? [...WHEN_SEGMENTS, { value: "custom", label: custom ? formatRange(range) : "Pick dates", icon: CalendarDays }]
      : WHEN_SEGMENTS;

  function pickWhen(when: When) {
    if (when === "custom") {
      if (datePicker) setDatesOpen((open) => !open || !custom);
      return;
    }
    setDatesOpen(false);
    update({ when, from: undefined, to: undefined });
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="lg:w-72 lg:shrink-0">
          <SearchBox value={filters.q} onCommit={(q) => update({ q })} />
        </div>
        <SegmentedControl
          label="When"
          options={segments}
          value={datesOpen ? "custom" : filters.when}
          onChange={pickWhen}
          className="min-w-0 lg:flex-1"
        />
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
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDatesOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Reveal>
      )}

      <CategoryChips filters={filters} facets={facets} onChange={(cats) => update({ cats })} />

      <div className="flex flex-wrap items-center gap-1.5">
        <ToggleChip on={filters.free} onClick={() => update({ free: !filters.free })} icon={Ticket}>
          Free only
        </ToggleChip>
        <ToggleChip on={filters.hideLong} onClick={() => update({ hideLong: !filters.hideLong })} icon={Layers}>
          Hide exhibitions
        </ToggleChip>
        {sources.length > 1 && (
          <button
            type="button"
            aria-expanded={sourcesOpen}
            onClick={() => setSourcesOpen((o) => !o)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all active:scale-95",
              filters.sources.length
                ? "border-primary/60 bg-primary/20 text-foreground"
                : "text-muted-foreground hover:text-foreground bg-white/[0.03] hover:border-white/20",
            )}
          >
            <Radio className="size-3.5" />
            {filters.sources.length ? `${filters.sources.length} of ${sources.length} sources` : "All sources"}
            <ChevronDown className={cn("size-3.5 transition-transform duration-300", sourcesOpen && "rotate-180")} />
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <p className="text-muted-foreground flex items-center gap-1.5 px-1" aria-live="polite">
            {isPending && <Loader2 className="size-3.5 animate-spin" aria-label="Updating" />}
            <span className="text-foreground font-semibold tabular-nums">{facets.total}</span>{" "}
            {facets.total === 1 ? noun.replace(/^events/, "event") : noun}
          </p>
          {hasActiveFilters(filters) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1 px-2 text-xs"
              onClick={() => {
                setDatesOpen(false);
                setFilters(DEFAULT_FILTERS);
              }}
            >
              <X className="size-3.5" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Reveal open={sourcesOpen}>
        <ul className="flex flex-wrap gap-1.5" aria-label="Sources">
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
                    "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all active:scale-95",
                    on
                      ? "border-primary/60 bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:text-foreground bg-white/[0.03] hover:border-white/20",
                    n === 0 && !on && "opacity-50",
                  )}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                  {s.name}
                  <span className="tabular-nums opacity-70">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Reveal>
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

/** An on/off filter as a chip with a small liquid switch inside, so its state reads at a glance. */
function ToggleChip({
  on,
  onClick,
  icon: Icon,
  children,
}: {
  on: boolean;
  onClick: () => void;
  icon: typeof Sun;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "group flex h-8 items-center gap-2 rounded-full border pr-1.5 pl-3 text-xs font-medium whitespace-nowrap transition-all active:scale-95",
        on
          ? "border-primary/60 bg-primary/20 text-foreground"
          : "text-muted-foreground hover:text-foreground bg-white/[0.03] hover:border-white/20",
      )}
    >
      <Icon className="size-3.5" />
      {children}
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-8 items-center rounded-full px-0.5 transition-colors duration-300",
          on ? "bg-primary shadow-[0_0_12px_-3px] shadow-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "block h-4 w-4 rounded-full transition-[transform,width] duration-300 ease-[cubic-bezier(0.34,1.4,0.5,1)] group-active:w-5",
            on ? "bg-primary-foreground translate-x-3 group-active:translate-x-2" : "bg-foreground",
          )}
        />
      </span>
    </button>
  );
}

function CategoryChips({
  filters,
  facets,
  onChange,
}: {
  filters: EventFilters;
  facets: Facets;
  onChange: (cats: EventCategory[]) => void;
}) {
  const shown = EVENT_CATEGORIES.filter((c) => facets.categories[c] || filters.cats.includes(c));
  if (shown.length === 0) return null;
  return (
    <ul className="no-scrollbar -mx-2.5 flex gap-1.5 overflow-x-auto px-2.5" aria-label="Categories">
      {shown.map((c) => {
        const on = filters.cats.includes(c);
        const n = facets.categories[c] ?? 0;
        return (
          <li key={c} className="shrink-0">
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? filters.cats.filter((x) => x !== c) : [...filters.cats, c])}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all active:scale-95",
                on ? "text-foreground" : "text-muted-foreground hover:text-foreground bg-white/[0.03] hover:border-white/20",
                filters.cats.length > 0 && !on && "opacity-70",
              )}
              style={on ? { borderColor: CATEGORY_COLORS[c], background: `${CATEGORY_COLORS[c]}30` } : undefined}
            >
              <span aria-hidden>{CATEGORY_EMOJI[c]}</span>
              {CATEGORY_LABELS[c]}
              <span className={cn("tabular-nums", on ? "text-foreground/70" : "text-muted-foreground/70")}>{n}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
