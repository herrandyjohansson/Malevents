import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventGridSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading events">
      <Skeleton className="h-5 w-48" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="gap-4 overflow-hidden pt-0">
            <Skeleton className="h-28 rounded-none" />
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
