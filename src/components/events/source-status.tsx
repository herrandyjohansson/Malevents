import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SourceStatus } from "@/lib/events/types";
import { cn } from "@/lib/utils";

export function SourceStatusBar({ sources }: { sources: SourceStatus[] }) {
  const failed = sources.filter((s) => s.state === "error");
  const active = sources.filter((s) => s.enabled);

  return (
    <div className="flex flex-col gap-3">
      {failed.length > 0 && (
        <Alert className="border-warning/30 bg-warning/5">
          <CircleAlert className="text-warning" />
          <AlertTitle>
            {failed.length === 1 ? "One source is unavailable" : `${failed.length} sources are unavailable`}
          </AlertTitle>
          <AlertDescription>
            Showing events from the other sources. Missing: {failed.map((s) => s.name).join(", ")}.
          </AlertDescription>
        </Alert>
      )}
      <ul className="flex flex-wrap gap-2" aria-label="Event sources">
        {active.map((s) => (
          <li key={s.id}>
            <Link
              href={`/?source=${s.id}`}
              title={s.error}
              className="bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors"
            >
              <span
                aria-hidden
                className={cn("size-1.5 rounded-full", s.state === "ok" ? "bg-success" : "bg-destructive")}
              />
              <span className="text-foreground font-medium">{s.name}</span>
              {s.state === "ok" ? s.count : "offline"}
              {s.demo && <span className="opacity-60">· demo</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
