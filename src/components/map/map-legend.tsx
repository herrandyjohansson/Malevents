import type { MapEvent } from "@/lib/events/view-types";

/** Categories present in `events`, as emoji + colour swatches. */
export function MapLegend({ events }: { events: MapEvent[] }) {
  const categories = new Map(events.map((e) => [e.category, e]));
  if (categories.size === 0) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" aria-label="Map legend">
      {[...categories.values()].map((e) => (
        <li key={e.category} className="text-muted-foreground flex items-center gap-1.5">
          <span
            aria-hidden
            className="flex size-5 items-center justify-center rounded-full text-[11px]"
            style={{ background: e.color }}
          >
            {e.emoji}
          </span>
          {e.categoryLabel}
        </li>
      ))}
    </ul>
  );
}
