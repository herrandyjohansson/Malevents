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
 * any open sheet; only the server-rendered data updates.
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

  if (names.length === 0) return null;
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return (
    <p role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
      {tries < MAX_TRIES ? (
        <>
          <Loader2 className="text-primary size-4 shrink-0 animate-spin" aria-hidden />
          Still fetching events from {list}. They&apos;ll appear here by themselves.
        </>
      ) : (
        <>{list} {names.length === 1 ? "is" : "are"} slow right now. Reload in a minute to see their events.</>
      )}
    </p>
  );
}
