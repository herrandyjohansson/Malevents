import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { SourceStatus } from "@/lib/events/types";

export function SourceStatusBar({ sources }: { sources: SourceStatus[] }) {
  const failed = sources.filter((s) => !s.ok);

  return (
    <div className="flex flex-col gap-3">
      {failed.length > 0 && (
        <Alert>
          <CircleAlert />
          <AlertTitle>
            {failed.length === 1 ? "One source is unavailable" : `${failed.length} sources are unavailable`}
          </AlertTitle>
          <AlertDescription>
            Showing events from the other sources. Missing: {failed.map((s) => s.name).join(", ")}.
          </AlertDescription>
        </Alert>
      )}
      <ul className="flex flex-wrap gap-2" aria-label="Event sources">
        {sources.map((s) => (
          <li key={s.id}>
            <Badge variant={s.ok ? "outline" : "destructive"} title={s.ok ? undefined : s.error}>
              <span
                className={s.ok ? "size-1.5 rounded-full bg-emerald-500" : "size-1.5 rounded-full bg-white"}
                aria-hidden
              />
              {s.name}
              {s.ok ? ` · ${s.count}` : " · offline"}
              {s.demo && <span className="opacity-70">(demo)</span>}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
