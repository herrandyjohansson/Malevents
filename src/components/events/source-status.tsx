import Link from "next/link";

import { listedSources } from "@/lib/events/pending";
import type { SourceStatus } from "@/lib/events/types";

/** Where the listings come from, at the foot of the page. Each name filters to that site's events. */
export function SourceList({ sources }: { sources: SourceStatus[] }) {
  const listed = listedSources(sources);
  if (listed.length === 0) return null;
  return (
    <section aria-labelledby="sources-heading" className="flex flex-col gap-3 border-t pt-6">
      <h2 id="sources-heading" className="text-sm font-semibold">
        Where these listings come from
      </h2>
      <ul className="flex flex-wrap gap-2">
        {listed.map((s) => (
          <li key={s.id}>
            <Link
              href={`/?src=${s.id}`}
              className="bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors"
            >
              <span className="text-foreground font-medium">{s.name}</span>
              {s.count}
              {s.demo && <span className="opacity-60">· demo</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
