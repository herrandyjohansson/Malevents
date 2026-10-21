import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { EventDetail } from "@/components/events/event-detail";
import { EventDetailSkeleton } from "@/components/events/event-detail-skeleton";
import { EventMissing } from "@/components/events/event-missing";
import { getEventDetail } from "@/lib/events/event-detail";
import { CATEGORY_LABELS, formatEventDate } from "@/lib/events/format";

export async function generateMetadata({ params }: PageProps<"/events/[id]">): Promise<Metadata> {
  const detail = await getEventDetail(decodeURIComponent((await params).id));
  if (!detail) return { title: "Event not found", robots: { index: false } };
  const { event } = detail;
  return {
    title: event.title,
    description: `${CATEGORY_LABELS[event.category]} · ${formatEventDate(event)}${event.venue ? ` · ${event.venue.name}` : ""}`,
  };
}

/** An event's own page: what you land on from a shared link. From a list it opens as a sheet instead. */
export default function EventPage({ params }: PageProps<"/events/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 pt-5 pb-12 sm:px-6">
      <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex h-11 w-fit items-center gap-1.5 text-sm">
        <ArrowLeft className="size-4" aria-hidden />
        All events
      </Link>
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventPageBody params={params} />
      </Suspense>
    </main>
  );
}

async function EventPageBody({ params }: { params: PageProps<"/events/[id]">["params"] }) {
  const { id } = await params;
  // Request-time: whether the event has ended depends on the current time.
  await connection();
  const detail = await getEventDetail(decodeURIComponent(id));
  return detail ? <EventDetail detail={detail} /> : <EventMissing />;
}
