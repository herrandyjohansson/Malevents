import { CalendarX } from "lucide-react";
import Link from "next/link";

/** For a link to an event the listings no longer have (it was removed upstream or ended long ago). */
export function EventMissing() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-4 py-16 text-center">
      <CalendarX className="text-muted-foreground size-8" aria-hidden />
      <h1 className="text-lg font-semibold">This event isn&apos;t in the listings any more</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        It may have been removed by the venue, or it ended a while ago.
      </p>
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
