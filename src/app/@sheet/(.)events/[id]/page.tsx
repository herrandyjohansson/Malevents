import { connection } from "next/server";
import { Suspense } from "react";

import { EventDetail } from "@/components/events/event-detail";
import { EventDetailSkeleton } from "@/components/events/event-detail-skeleton";
import { EventMissing } from "@/components/events/event-missing";
import { EventSheet } from "@/components/events/event-sheet";
import { getEventDetail } from "@/lib/events/event-detail";

/** /events/[id] opened from inside the app: the same detail, in a sheet over the current page. */
export default function EventSheetPage({ params }: PageProps<"/events/[id]">) {
  return (
    <EventSheet>
      <Suspense fallback={<EventDetailSkeleton />}>
        <SheetBody params={params} />
      </Suspense>
    </EventSheet>
  );
}

async function SheetBody({ params }: { params: PageProps<"/events/[id]">["params"] }) {
  const { id } = await params;
  await connection();
  const detail = await getEventDetail(decodeURIComponent(id));
  return detail ? <EventDetail detail={detail} inSheet /> : <EventMissing />;
}
