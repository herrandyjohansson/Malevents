import type { Metadata } from "next";

import { Missing } from "@/components/events/event-missing";

export const metadata: Metadata = { title: "Page not found" };

/** Unknown pages, venues and days: the same friendly dead end as a missing event. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-5 pb-12 sm:px-6">
      <Missing title="There's nothing at this address">
        The link may be old or mistyped. Everything that&apos;s on is a tap away.
      </Missing>
    </main>
  );
}
