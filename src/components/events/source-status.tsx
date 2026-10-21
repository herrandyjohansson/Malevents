import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SourceStatus } from "@/lib/events/types";
import { cn } from "@/lib/utils";

/** Shown above the results only when a listing site couldn't be read, so the list's gaps are explained. */
export function SourceAlert({ sources }: { sources: SourceStatus[] }) {
  const failed = sources.filter((s) => s.state === "error");
  if (failed.length === 0) return null;
  return (
    <Alert className="border-warning/30 bg-warning/5">
      <CircleAlert className="text-warning" />
      <AlertTitle>
        {failed.length === 1
          ? `Events from ${failed[0].name} are missing right now`
          : `Events from ${failed.length} listing sites are missing right now`}
      </AlertTitle>
      <AlertDescription>
        {failed.length === 1 ? "Its site" : `${failed.map((s) => s.name).join(", ")}`} couldn&apos;t be reached. Everything
        else is up to date; it will be back on the next refresh.
      </AlertDescription>
    </Alert>
  );
}

/** Where the listings come from, at the foot of the page. Each name filters to that site's events. */
export function SourceList({ sources }: { sources: SourceStatus[] }) {
  const active = sources.filter((s) => s.enabled);
  return (
    <section aria-labelledby="sources-heading" className="flex flex-col gap-3 border-t pt-6">
      <h2 id="sources-heading" className="text-sm font-semibold">
        Where these listings come from
      </h2>
      <ul className="flex flex-wrap gap-2">
        {active.map((s) => (
          <li key={s.id}>
            <Link
              href={`/?src=${s.id}`}
              title={s.state === "error" ? "Couldn't be reached just now" : undefined}
              className="bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors"
            >
              <span
                aria-hidden
                className={cn("size-1.5 rounded-full", s.state === "ok" ? "bg-success" : "bg-destructive")}
              />
              <span className="text-foreground font-medium">{s.name}</span>
              {s.state === "ok" ? s.count : "unavailable"}
              {s.demo && <span className="opacity-60">· demo</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
