import { CalendarX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** A friendly dead end: what isn't here, why, and the way back to the listings. */
export function Missing({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-16 text-center">
      <CalendarX className="text-muted-foreground size-8" aria-hidden />
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">{children}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/tonight" className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-full px-5 text-sm font-medium">
          See what&apos;s on tonight
        </Link>
        <Link href="/" className="hover:bg-accent inline-flex h-11 items-center rounded-full border px-5 text-sm font-medium">
          Browse all events
        </Link>
      </div>
    </div>
  );
}

/** For a link to an event the listings no longer have (it was removed upstream or ended long ago). */
export function EventMissing() {
  return (
    <Missing title="This event isn't in the listings any more">
      It may have been removed by the venue, or it ended a while ago.
    </Missing>
  );
}
