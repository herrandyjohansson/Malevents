"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useOptimistic, useRef, useTransition } from "react";

import { dayNames } from "@/lib/days";
import { cn } from "@/lib/utils";

export interface StripDay {
  day: string;
  /** Events starting that day, not counting exhibitions. */
  count: number;
}

/**
 * A row of days to swipe through at the top of Tonight. Picking one loads
 * that day's events below in the same layout; the URL keeps the day
 * (`?day=`), today being the plain `/tonight`.
 */
export function DayStrip({ days, today, selected }: { days: StripDay[]; today: string; selected: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(selected);
  const scroller = useRef<HTMLOListElement>(null);

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
      router.push(day === today ? "/tonight" : `/tonight?day=${day}`, { scroll: false });
    });
  }

  return (
    <nav aria-label="Pick a day" className="-mx-4 sm:-mx-6">
      <ol
        ref={scroller}
        className="no-scrollbar fade-edges flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-4 py-1 sm:px-6"
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
