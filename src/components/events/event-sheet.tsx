"use client";

import { useRouter } from "next/navigation";

import { Sheet, SheetContent, SheetDescription } from "@/components/ui/sheet";

/**
 * An event opened from a list, over that list. The URL is the event's own
 * page, so it can be shared; closing goes back to where the visitor was.
 */
export function EventSheet({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <Sheet defaultOpen onOpenChange={(open) => !open && router.back()}>
      <SheetContent className="md:w-[34rem]">
        <SheetDescription className="sr-only">Event details, tickets and directions</SheetDescription>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-12 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-6 md:pt-14">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
