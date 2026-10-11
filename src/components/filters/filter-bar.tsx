"use client";

import { CalendarDays, Loader2, Moon, SlidersHorizontal, Sparkles, Sun, Ticket, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
  const { mode, facets, sources, today, variant = "bar", noun = "events", className } = props;
  const { filters, update, setFilters, isPending } = useFilters(mode);
  const [panelOpen, setPanelOpen] = useState(false);
  const count = activeFilterCount(filters);
  const range = resolveRange(filters, today);
  const floating = variant === "floating";

  const chip = (active: boolean) =>
    cn(
      "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-all active:scale-95",
      active
        ? "border-primary/60 bg-primary/20 text-foreground shadow-[0_0_16px_-6px] shadow-primary"
        : "text-muted-foreground hover:text-foreground hover:border-white/20 bg-white/[0.03]",
      floating && "h-9 shadow-lg backdrop-blur-md",
      floating && !active && "bg-background/80",
      floating && active && "bg-primary/35",
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
      showSearch={floating}
    />
  );

  if (floating) {
    return (
      <div className={cn("no-scrollbar flex gap-1.5 overflow-x-auto", className)}>
        {filtersButton}
        {quickChips}
        {panel}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="flex gap-2 lg:w-80 lg:shrink-0">
          <SearchBox value={filters.q} onCommit={(q) => update({ q })} />
          <div className="lg:hidden">{filtersButton}</div>
        </div>
        <div className="no-scrollbar -mx-2.5 flex gap-1.5 overflow-x-auto px-2.5 lg:mx-0 lg:px-0">
          {quickChips}
          <div className="ml-auto max-lg:hidden">{filtersButton}</div>
        </div>
      </div>

      <CategoryChips filters={filters} facets={facets} onChange={(cats) => update({ cats })} />

      <div className="flex min-h-6 flex-wrap items-center gap-1.5 text-xs">
        <p className="text-muted-foreground mr-1 flex items-center gap-1.5" aria-live="polite">
          {isPending && <Loader2 className="size-3.5 animate-spin" aria-label="Updating" />}
          <span className="text-foreground font-semibold tabular-nums">{facets.total}</span>{" "}
          {facets.total === 1 ? noun.replace(/^events/, "event") : noun}
        </p>
        <ActivePills filters={filters} sources={sources} today={today} update={update} />
        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-6 px-2 text-xs"
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            Clear all
          </Button>
        )}
      </div>
      {panel}
    </div>
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

/** One removable pill per active filter, so it's always clear what is narrowing the list. */
export function ActivePills({
  filters,
  sources,
  today,
  update,
}: {
  filters: EventFilters;
  sources: { id: string; name: string }[];
  today: string;
  update: (changes: Partial<EventFilters>) => void;
}) {
  const names = new Map(sources.map((s) => [s.id, s.name]));
  const range = resolveRange(filters, today);
  const pills: { key: string; label: string; remove: () => void }[] = [];
  if (filters.q) pills.push({ key: "q", label: `“${filters.q}”`, remove: () => update({ q: "" }) });
  if (filters.when === "custom" && range)
    pills.push({ key: "when", label: formatRange(range), remove: () => update({ when: "all", from: undefined, to: undefined }) });
  for (const c of filters.cats)
    pills.push({ key: `c:${c}`, label: CATEGORY_LABELS[c], remove: () => update({ cats: filters.cats.filter((x) => x !== c) }) });
  for (const s of filters.sources)
    pills.push({ key: `s:${s}`, label: names.get(s) ?? s, remove: () => update({ sources: filters.sources.filter((x) => x !== s) }) });
  if (filters.hideLong) pills.push({ key: "long", label: "No exhibitions", remove: () => update({ hideLong: false }) });

  return pills.map((p) => (
    <button
      key={p.key}
      type="button"
      onClick={p.remove}
      aria-label={`Remove filter ${p.label}`}
      className="bg-secondary hover:bg-accent animate-in fade-in zoom-in-95 flex h-6 items-center gap-1 rounded-full border pr-1.5 pl-2.5 text-xs font-medium transition-colors"
    >
      {p.label}
      <X className="text-muted-foreground size-3" />
    </button>
  ));
}
