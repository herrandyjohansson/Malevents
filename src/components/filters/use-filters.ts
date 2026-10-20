"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

import { filtersToParams, parseFilters, type EventFilters } from "@/lib/events/filters";

/**
 * Read and write the shared filters in the URL.
 *
 * - "server": the page renders results from the search params, so changes
 *   navigate (in a transition, keeping the current results up meanwhile).
 * - "client": the page already has every event and filters in the browser,
 *   so changes only rewrite the URL, which useSearchParams picks up.
 */
export function useFilters(mode: "server" | "client") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // Same object until the filters change (not on other params such as ?month=),
  // so views can memoize their filtering on it.
  const key = filtersToParams(parseFilters(searchParams)).toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(key)), [key]);

  function setFilters(next: EventFilters) {
    const qs = filtersToParams(next, new URLSearchParams(searchParams)).toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (mode === "client") window.history.replaceState(null, "", url);
    else startTransition(() => router.replace(url, { scroll: false }));
  }

  function update(changes: Partial<EventFilters>) {
    setFilters({ ...filters, ...changes });
  }

  return { filters, update, setFilters, isPending };
}
