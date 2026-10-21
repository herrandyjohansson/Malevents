import { Skeleton } from "@/components/ui/skeleton";

export function EventDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading event">
      <Skeleton className="aspect-[16/9] rounded-2xl" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-20" />
      <Skeleton className="h-12 w-56 rounded-full" />
    </div>
  );
}
