"use client";

import { cn } from "@/lib/utils";

/**
 * A list that drives the cursor spotlight on its `.spotlight-card` children.
 * One delegated listener here, so the cards themselves stay server components.
 */
export function SpotlightList({ className, ...props }: React.ComponentProps<"ul">) {
  function handlePointerMove(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== "mouse") return;
    const card = (e.target as Element).closest<HTMLElement>(".spotlight-card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return <ul className={cn(className)} onPointerMove={handlePointerMove} {...props} />;
}
