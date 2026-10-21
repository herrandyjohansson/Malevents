"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

import { DEFAULT_FILTERS, filtersToParams, parseFilters, type EventFilters, type When } from "@/lib/events/filters";

/**
 * Read and write the shared filters in the URL.
 *
 * - "server": the page renders results from the search params, so changes
 *   navigate (in a transition, keeping the current results up meanwhile).
 * - "client": the page already has every event and filters in the browser,
 *   so changes only rewrite the URL, which useSearchParams picks up.
 *
 * `defaultWhen` is the page's time window when the URL names none; "Clear
 * all" goes back to it.
 */
export function useFilters(mode: "server" | "client", defaultWhen: When = "all") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // Same object until the filters change (not on other params such as ?month=),
  // so views can memoize their filtering on it.
  const key = filtersToParams(parseFilters(searchParams, defaultWhen), undefined, defaultWhen).toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(key), defaultWhen), [key, defaultWhen]);
  const defaults = useMemo(() => ({ ...DEFAULT_FILTERS, when: defaultWhen }), [defaultWhen]);

  function setFilters(next: EventFilters) {
    const base = new URLSearchParams(searchParams);
    // New filters start from the first page of results again.
    base.delete("show");
    const qs = filtersToParams(next, base, defaultWhen).toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (mode === "client") window.history.replaceState(null, "", url);
    else startTransition(() => router.replace(url, { scroll: false }));
  }

  function update(changes: Partial<EventFilters>) {
    setFilters({ ...filters, ...changes });
  }

  return { filters, defaults, update, setFilters, isPending };
}
