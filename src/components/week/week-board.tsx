import { dayNames, formatDayMonth } from "@/lib/days";
import { CATEGORY_COLORS, CATEGORY_LABELS, formatPrice, formatTime } from "@/lib/events/format";
import type { WeekDay } from "@/lib/events/week-data";
import { cn } from "@/lib/utils";

import { ScrollButtons } from "./scroll-buttons";

const BOARD_ID = "week-board";

function dayLabels(day: string, index: number) {
  const { weekday } = dayNames(day);
  return {
    name: index === 0 ? "Today" : index === 1 ? "Tomorrow" : weekday,
    short: index === 0 ? "Today" : weekday.slice(0, 3),
    date: formatDayMonth(day),
  };
}

/**
 * Seven day columns side by side, like a planner board. On phones each column
 * is a screen wide and you swipe between days; the chips above jump to one.
 */
export function WeekBoard({ week, ongoing }: { week: WeekDay[]; ongoing: number }) {
  return (
    <section aria-labelledby="board-heading" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="board-heading" className="text-lg font-semibold">
            Day by day
          </h2>
          <p className="text-muted-foreground text-sm">
            Everything starting in the next seven days.
            {ongoing > 0 &&
              ` Plus ${ongoing} longer ${ongoing === 1 ? "run" : "runs"}, like exhibitions, that you can find under Discover.`}
          </p>
        </div>
        <ScrollButtons targetId={BOARD_ID} label="days" />
      </div>

      <nav aria-label="Jump to a day" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        {week.map((d, i) => {
          const { short, date } = dayLabels(d.day, i);
          return (
            <a
              key={d.day}
              href={`#day-${d.day}`}
              className="flex shrink-0 items-baseline gap-1.5 rounded-full border bg-white/[0.03] px-3 py-1.5 text-sm transition-colors hover:bg-white/[0.08]"
            >
              <span className="font-medium">{short}</span>
              <span className="text-muted-foreground text-xs">{date}</span>
              <span className="bg-primary/15 text-primary rounded-full px-1.5 text-xs font-semibold tabular-nums">
                {d.events.length}
              </span>
            </a>
          );
        })}
      </nav>

      <ol
        id={BOARD_ID}
        className="no-scrollbar -mx-4 flex items-start snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {week.map((d, i) => (
          <DayColumn key={d.day} day={d} index={i} />
        ))}
      </ol>
    </section>
  );
}

function DayColumn({ day, index }: { day: WeekDay; index: number }) {
  const { name, date } = dayLabels(day.day, index);
  const total = day.events.length;

  return (
    <li
      id={`day-${day.day}`}
      className={cn(
        "bg-card/60 flex w-[calc(100vw-2rem)] shrink-0 snap-start scroll-mt-24 flex-col rounded-2xl border sm:w-[19rem]",
        index === 0 && "gradient-ring relative",
      )}
    >
      <header className="flex flex-col gap-2.5 border-b border-white/5 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold">
            {name} <span className="text-muted-foreground font-normal">{date}</span>
          </h3>
          <span className="text-muted-foreground text-xs tabular-nums">
            {total} {total === 1 ? "event" : "events"}
          </span>
        </div>
        {/* The day's mix of categories as one stacked bar. */}
        <div
          className="flex h-1.5 overflow-hidden rounded-full bg-white/5"
          role="img"
          aria-label={day.mix.map((m) => `${m.count} ${CATEGORY_LABELS[m.category]}`).join(", ") || "No events"}
        >
          {day.mix.map((m) => (
            <span
              key={m.category}
              className="h-full"
              style={{ width: `${(m.count / total) * 100}%`, background: CATEGORY_COLORS[m.category] }}
            />
          ))}
        </div>
      </header>

      {total === 0 ? (
        <p className="text-muted-foreground p-4 text-sm">Nothing listed yet.</p>
      ) : (
        <ul className="thin-scrollbar flex flex-col gap-1 p-2 lg:max-h-[34rem] lg:overflow-y-auto">
          {day.events.map((event) => {
            const color = CATEGORY_COLORS[event.category];
            const price = formatPrice(event);
            return (
              <li key={event.id}>
                <article className="group relative flex gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.05]">
                  <time
                    dateTime={event.startsAt}
                    className="text-muted-foreground w-11 shrink-0 pt-0.5 text-xs font-medium tabular-nums"
                  >
                    {formatTime(event.startsAt)}
                  </time>
                  <span aria-hidden className="mt-1 w-0.5 shrink-0 self-stretch rounded-full" style={{ background: color }} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h4 className="line-clamp-2 text-sm leading-snug font-medium">
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="after:absolute after:inset-0 group-hover:underline"
                      >
                        {event.title}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </h4>
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <span className="sr-only">{CATEGORY_LABELS[event.category]}, </span>
                      {event.venue && <span className="truncate">{event.venue.name}</span>}
                      {event.soldOut ? (
                        <span className="text-destructive shrink-0 font-medium">Sold out</span>
                      ) : (
                        price && (
                          <span className={cn("shrink-0", event.isFree && "text-success font-medium")}>
                            {event.venue && "· "}
                            {price}
                          </span>
                        )
                      )}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
