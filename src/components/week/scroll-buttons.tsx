"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Previous/next buttons for a horizontal scroller, for people with a mouse
 * wheel and no trackpad. Touch and keyboard users scroll the list directly.
 */
export function ScrollButtons({ targetId, label }: { targetId: string; label: string }) {
  const scroll = (direction: 1 | -1) => {
    const el = document.getElementById(targetId);
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="hidden gap-1.5 sm:flex">
      <Button variant="outline" size="icon" className="rounded-full" onClick={() => scroll(-1)}>
        <ChevronLeft />
        <span className="sr-only">Scroll {label} back</span>
      </Button>
      <Button variant="outline" size="icon" className="rounded-full" onClick={() => scroll(1)}>
        <ChevronRight />
        <span className="sr-only">Scroll {label} forward</span>
      </Button>
    </div>
  );
}
