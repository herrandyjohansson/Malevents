import { Skeleton } from "@/components/ui/skeleton";

export function EventGridSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading events">
      <div className="flex flex-col gap-2.5 rounded-2xl border p-2.5">
        <Skeleton className="h-10 rounded-full" />
        <Skeleton className="h-8 w-2/3 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-card overflow-hidden rounded-2xl border">
            <Skeleton className="aspect-[16/9] rounded-none" />
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
