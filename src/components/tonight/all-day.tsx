import { Palette } from "lucide-react";

import { TimelineEvent } from "@/components/tonight/timeline-event";
import type { MalmoEvent } from "@/lib/events/types";

/** Exhibitions and multi-day events open that day, folded away under the day's own events. */
export function AllDay({ events }: { events: MalmoEvent[] }) {
  if (events.length === 0) return null;
  return (
    <details className="group bg-card/50 rounded-2xl border">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <Palette className="text-muted-foreground size-4" />
        Open all day: {events.length === 1 ? "1 exhibition" : `${events.length} exhibitions`} and multi-day events
        <span className="text-muted-foreground ml-auto text-xs group-open:hidden">Show</span>
        <span className="text-muted-foreground ml-auto hidden text-xs group-open:inline">Hide</span>
      </summary>
      <ul className="grid grid-cols-1 gap-2.5 p-2.5 pt-0 sm:grid-cols-2">
        {events.map((e) => (
          <li key={e.id}>
            <TimelineEvent event={e} />
          </li>
        ))}
      </ul>
    </details>
  );
}
