import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventGridSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading events">
      <Skeleton className="h-6 w-80" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="gap-0 overflow-hidden py-0">
            <Skeleton className="h-1 rounded-none" />
            <div className="flex gap-4 p-5">
              <Skeleton className="h-16 w-14 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
