import { Bug, CircleAlert, CircleX, Info, type LucideIcon } from "lucide-react";

import { TIME_ZONE } from "@/lib/events/config";
import type { LogEntry, LogLevel } from "@/lib/log";
import { cn } from "@/lib/utils";

const LEVELS: Record<LogLevel, { label: string; icon: LucideIcon; className: string }> = {
  debug: { label: "debug", icon: Bug, className: "text-muted-foreground" },
  info: { label: "info", icon: Info, className: "text-foreground" },
  warn: { label: "warn", icon: CircleAlert, className: "text-warning" },
  error: { label: "error", icon: CircleX, className: "text-destructive" },
};

// Server-rendered only, so Intl can't cause a hydration mismatch here.
const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Fields every entry has, or that the row shows on its own. */
const SHOWN = new Set(["ts", "level", "event", "source"]);

/** The rest of the fields as `key=value`, short values only, for the one-line view. */
function summary(entry: LogEntry) {
  return Object.entries(entry)
    .filter(([key, value]) => !SHOWN.has(key) && value !== undefined && value !== null && typeof value !== "object")
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("  ");
}

/**
 * The newest entries as a terminal-style stream. Each row opens to the full
 * JSON. Everything is rendered as text, so upstream content in a log line
 * can't become markup.
 */
export function LogStream({ entries, total }: { entries: LogEntry[]; total: number }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-[oklch(0.1_0.01_278)] font-mono text-xs">
      <div className="text-muted-foreground flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="bg-destructive/70 size-2.5 rounded-full" />
          <span aria-hidden className="bg-warning/70 size-2.5 rounded-full" />
          <span aria-hidden className="bg-success/70 size-2.5 rounded-full" />
          <span className="ml-2">malevents · server log</span>
        </span>
        <span>
          {entries.length === total ? `${total} entries` : `newest ${entries.length} of ${total} matching`}
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="text-muted-foreground px-3 py-8 text-center">No log entries match. Load a page to create some.</p>
      ) : (
        <ol className="max-h-[36rem] divide-y divide-white/5 overflow-y-auto" aria-label="Log entries, newest first">
          {entries.map((entry, i) => {
            const level = LEVELS[entry.level] ?? LEVELS.info;
            const Icon = level.icon;
            return (
              <li key={`${entry.ts}-${i}`}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-1.5 hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                    <time dateTime={entry.ts} className="text-muted-foreground shrink-0 tabular-nums">
                      {clock.format(new Date(entry.ts))}
                    </time>
                    <span className={cn("flex w-14 shrink-0 items-center gap-1", level.className)}>
                      <Icon className="size-3.5" aria-hidden />
                      {level.label}
                    </span>
                    <span className="text-foreground shrink-0">{entry.event}</span>
                    {typeof entry.source === "string" && (
                      <span className="text-primary shrink-0">[{entry.source}]</span>
                    )}
                    <span className="text-muted-foreground min-w-0 truncate group-open:whitespace-normal">
                      {summary(entry)}
                    </span>
                  </summary>
                  <pre className="text-muted-foreground overflow-x-auto bg-black/30 px-3 py-2 whitespace-pre-wrap break-all">
                    {JSON.stringify(entry, null, 2)}
                  </pre>
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
