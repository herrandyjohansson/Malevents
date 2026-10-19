"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * One search param used as view state, so the view can be shared as a link.
 * Writes go through history.replaceState: the page already has its data, so
 * there is nothing to navigate to, and useSearchParams picks the change up.
 * Setting null (or "") removes the param.
 */
export function useUrlParam(key: string): [string | null, (value: string | null) => void] {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }

  return [searchParams.get(key), set];
}
