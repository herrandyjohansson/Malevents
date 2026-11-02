"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/** Pause after a refresh has landed before the next one (each refresh itself waits up to ~3 s on the server). */
const REFRESH_MS = 1500;
/** Give up refreshing after this many tries (about 40 s); a slow site then waits for the next visit. */
const MAX_TRIES = 16;

/**
 * Shown while some listing sites are still being fetched (a cold cache):
 * the page already shows what has arrived, and refreshes itself in the
 * background until the rest is in. The refresh keeps scroll, filters and
 * any open sheet; only the server-rendered data updates. Visitors see a
 * neutral loading line, never which site is slow; when it gives up, the
 * line goes away and the admin shows the source's state.
 */
export function PendingSources({ names }: { names: string[] }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [tries, setTries] = useState(0);
  const key = names.join("|");

  // One refresh at a time: a refresh overtaken by the next one would never be shown.
  useEffect(() => {
    if (!key || refreshing || tries >= MAX_TRIES) return;
    const timer = setTimeout(() => {
      startTransition(() => router.refresh());
      setTries((n) => n + 1);
    }, REFRESH_MS);
    return () => clearTimeout(timer);
  }, [key, tries, refreshing, router]);

  if (names.length === 0 || tries >= MAX_TRIES) return null;
  return (
    <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
      <Loader2 className="text-primary size-4 shrink-0 animate-spin" aria-hidden />
      Loading more events…
    </p>
  );
}
