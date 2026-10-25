"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useOptimistic, useRef, useTransition, type PointerEvent } from "react";

import { dayNames } from "@/lib/days";
import { cn } from "@/lib/utils";

export interface StripDay {
  day: string;
  /** Events starting that day, not counting exhibitions. */
  count: number;
}

/**
 * A row of days to swipe or mouse-drag through at the top of Tonight. Picking one loads
 * that day's events below in the same layout; the URL keeps the day
 * (`?day=`), today being the plain `/tonight`.
 */
export function DayStrip({ days, today, selected }: { days: StripDay[]; today: string; selected: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(selected);
  const scroller = useRef<HTMLOListElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; left: number } | null>(null);
  const dragged = useRef(false);

  // Bring the picked day into view without moving the page itself.
  useLayoutEffect(() => {
    const list = scroller.current;
    const item = list?.querySelector<HTMLElement>(`[data-day="${selected}"]`);
    if (!list || !item) return;
    const target = item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: list.scrollLeft === 0 ? "instant" : "smooth" });
  }, [selected]);

  function pick(day: string) {
    if (day === shown) return;
    startTransition(() => {
      setShown(day);
      const params = new URLSearchParams(searchParams);
      if (day === today) params.delete("day");
      else params.set("day", day);
      const query = params.toString();
      router.push(query ? `/tonight?${query}` : "/tonight", { scroll: false });
    });
  }

  function onPointerDown(e: PointerEvent<HTMLOListElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    // Native button focus can smooth-scroll the rail underneath an in-progress drag.
    e.preventDefault();
    if (e.target instanceof Element) {
      e.target.closest("button")?.focus({ preventScroll: true });
    }
    e.currentTarget.scrollTo({ left: e.currentTarget.scrollLeft, behavior: "instant" });
    dragged.current = false;
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, left: e.currentTarget.scrollLeft };
  }

  function onPointerMove(e: PointerEvent<HTMLOListElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== e.pointerId) return;
    const delta = e.clientX - start.x;
    if (!dragged.current) {
      if (Math.abs(delta) <= 5) return;
      if (Math.abs(e.clientY - start.y) > Math.abs(delta)) {
        drag.current = null;
        return;
      }
      dragged.current = true;
      e.currentTarget.dataset.dragging = "true";
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
    e.currentTarget.scrollTo({ left: start.left - delta, behavior: "instant" });
  }

  function endDrag(e: PointerEvent<HTMLOListElement>) {
    if (drag.current?.pointerId !== e.pointerId) return;
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <nav aria-label="Pick a day" className="-mx-4 sm:-mx-6">
      <ol
        ref={scroller}
        className="no-scrollbar fade-edges flex cursor-grab snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-4 py-1 select-none data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none data-[dragging=true]:scroll-auto sm:px-6 [&_button]:cursor-inherit"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onPointerLeave={(e) => {
          if (!dragged.current) endDrag(e);
        }}
        onClickCapture={(e) => {
          // A released drag must not pick the date under the pointer; keyboard clicks still work.
          if (dragged.current && e.detail > 0) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {days.map(({ day, count }, i) => {
          const names = dayNames(day);
          const active = day === shown;
          const newMonth = i > 0 && names.day === 1;
          return (
            <li key={day} data-day={day} className="flex shrink-0 snap-center items-stretch gap-2">
              {newMonth && (
                <span
                  aria-hidden
                  className="text-muted-foreground flex items-center pr-1 pl-2 text-xs font-semibold tracking-wide uppercase [writing-mode:vertical-rl] rotate-180"
                >
                  {names.month.slice(0, 3)}
                </span>
              )}
              <button
                type="button"
                onClick={() => pick(day)}
                aria-current={active ? "date" : undefined}
                aria-label={`${day === today ? "Today, " : ""}${names.weekday} ${names.day} ${names.month}, ${count === 1 ? "1 event" : `${count} events`}`}
                className={cn(
                  "flex w-14 flex-col items-center gap-0.5 rounded-2xl border py-2 transition-colors select-none",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/60 hover:bg-card hover:border-white/15",
                )}
              >
                <span className={cn("text-[11px] font-medium uppercase", !active && "text-muted-foreground")}>
                  {day === today ? "Today" : names.weekday.slice(0, 3)}
                </span>
                <span className="text-xl leading-tight font-semibold tabular-nums">{names.day}</span>
                <span className="flex h-3 items-center">
                  {active && pending ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : (
                    <span
                      className={cn(
                        "text-[10px] tabular-nums",
                        active ? "text-primary-foreground/80" : count ? "text-primary" : "text-muted-foreground/60",
                      )}
                    >
                      {count || "–"}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
