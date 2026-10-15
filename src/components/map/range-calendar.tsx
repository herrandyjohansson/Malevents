"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  addDays,
  addMonths,
  formatDay,
  formatMonth,
  inRange,
  monthGrid,
  monthStart,
  toRange,
  weekday,
  WEEKDAYS_SHORT,
  type DayRange,
} from "@/lib/days";

function dayAt(x: number, y: number) {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-day]");
  return el && !el.hasAttribute("disabled") ? el.dataset.day! : null;
}

/**
 * Month calendar where you pick a span of days by dragging across them
 * (mouse or touch). A plain click picks one day, Shift+click extends the
 * current range, and arrow keys move focus between days.
 */
export function RangeCalendar({
  today,
  lastMonth,
  value,
  onChange,
  countFor,
}: {
  /** Earliest selectable day, yyyy-mm-dd. */
  today: string;
  /** Last month you can page to (any day in it). */
  lastMonth: string;
  /** Null when no days are picked yet. */
  value: DayRange | null;
  onChange: (range: DayRange) => void;
  /** Number of events on a day, shown under the date. */
  countFor?: (day: string) => number;
}) {
  const [month, setMonth] = useState(() => monthStart(!value || value.from < today ? today : value.from));
  const [drag, setDrag] = useState<{ anchor: string; current: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const days = monthGrid(month);
  const shown = drag ? toRange(drag.anchor, drag.current) : value;
  // Roving tab stop: one day in the grid is reachable with Tab.
  const focusDay = value && monthStart(value.from) === month ? value.from : month <= today ? today : month;
  const canPrev = month > monthStart(today);
  const canNext = month < monthStart(lastMonth);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const day = dayAt(e.clientX, e.clientY);
    if (!day) return;
    e.preventDefault();
    // Keep receiving moves while the pointer (or finger) leaves the cell.
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ anchor: e.shiftKey && value ? value.from : day, current: day });
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const day = dayAt(e.clientX, e.clientY);
    if (day && day !== drag.current) setDrag({ ...drag, current: day });
  }

  function onPointerUp() {
    if (!drag) return;
    onChange(toRange(drag.anchor, drag.current));
    setDrag(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, day: string) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      const next = addDays(day, step);
      if (next < today || monthStart(next) > monthStart(lastMonth)) return;
      if (monthStart(next) !== month) setMonth(monthStart(next));
      // Focus after the (possibly new) month has rendered.
      requestAnimationFrame(() =>
        gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus(),
      );
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(e.shiftKey && value ? toRange(value.from, day) : { from: day, to: day });
    }
  }

  return (
    <div className="flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Previous month"
          disabled={!canPrev}
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <ChevronLeft />
        </Button>
        <h3 className="text-sm font-semibold" aria-live="polite">
          {formatMonth(month)}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Next month"
          disabled={!canNext}
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="text-muted-foreground grid grid-cols-7 text-center text-[11px] font-medium uppercase" aria-hidden>
        {WEEKDAYS_SHORT.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={`${formatMonth(month)}. Drag across days to pick a date range.`}
        className="grid touch-none grid-cols-7 gap-y-1"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {days.map((day) => {
          const outside = monthStart(day) !== month;
          const past = day < today;
          const selected = shown !== null && inRange(day, shown);
          const isStart = day === shown?.from;
          const isEnd = day === shown?.to;
          const count = past || !countFor ? 0 : countFor(day);
          return (
            <button
              key={day}
              type="button"
              data-day={day}
              disabled={past}
              tabIndex={day === focusDay ? 0 : -1}
              aria-pressed={selected}
              aria-label={countFor ? `${formatDay(day)}, ${count === 1 ? "1 event" : `${count} events`}` : formatDay(day)}
              onKeyDown={(e) => onKeyDown(e, day)}
              className={cn(
                "focus-visible:ring-ring/60 relative flex h-10 flex-col items-center justify-center text-sm outline-none focus-visible:z-10 focus-visible:ring-2",
                "disabled:text-muted-foreground/30 disabled:cursor-not-allowed",
                !past && "hover:bg-accent cursor-pointer rounded-md",
                outside && !past && "text-muted-foreground/60",
                selected && "bg-primary/20 hover:bg-primary/30 rounded-none text-foreground",
                selected && isStart && "rounded-l-md",
                selected && isEnd && "rounded-r-md",
                selected && (isStart || isEnd) && "bg-primary text-primary-foreground hover:bg-primary",
                // Round the band at week edges so multi-week ranges read as rows.
                selected && weekday(day) === 0 && "rounded-l-md",
                selected && weekday(day) === 6 && "rounded-r-md",
              )}
            >
              <span className={cn("leading-none", day === today && "font-bold underline underline-offset-4")}>
                {Number(day.slice(8))}
              </span>
              <span
                aria-hidden
                className={cn(
                  "mt-1 h-1 rounded-full",
                  count === 0 ? "w-0" : count < 3 ? "w-1" : count < 6 ? "w-2.5" : "w-4",
                  selected && (isStart || isEnd) ? "bg-primary-foreground/80" : "bg-primary",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
