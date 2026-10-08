import { connection } from "next/server";

import { Skeleton } from "@/components/ui/skeleton";
import { getAllEvents } from "@/lib/events/aggregate";
import { weekMapEvents } from "@/lib/events/map-data";

import { WeekMapCard } from "./week-map-card";

export async function WeekMapPreview() {
  await connection();
  const { events, sources } = await getAllEvents();
  return <WeekMapCard events={weekMapEvents(events, sources, new Date())} />;
}

export function WeekMapPreviewSkeleton() {
  return <Skeleton className="h-[25rem] rounded-xl" />;
}
