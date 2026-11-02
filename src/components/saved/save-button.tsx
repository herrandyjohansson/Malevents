"use client";

import { Heart, HeartOff } from "lucide-react";
import { useState } from "react";

import { SAVE_BLOCKED_MESSAGE, toggleSaved, useIsSaved, type SavedEvent } from "@/lib/saved";
import { cn } from "@/lib/utils";

/**
 * Heart toggle for one event. It pops and throws a ring of sparks when you
 * save. If the browser won't store it, the heart is crossed out and says why.
 */
export function SaveButton({
  event,
  className,
}: {
  event: Omit<SavedEvent, "savedAt">;
  className?: string;
}) {
  const saved = useIsSaved(event);
  // Only animate on the click that saves, not every time a saved heart renders.
  const [popping, setPopping] = useState(false);
  const [blocked, setBlocked] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={blocked ? `${SAVE_BLOCKED_MESSAGE} ${event.title}` : saved ? `Remove ${event.title} from saved` : `Save ${event.title}`}
      title={blocked ? SAVE_BLOCKED_MESSAGE : saved ? "Saved" : "Save"}
      onClick={() => {
        const stored = toggleSaved(event);
        setBlocked(!stored);
        setPopping(stored && !saved);
      }}
      onAnimationEnd={(e) => e.animationName === "heart-sparks" && setPopping(false)}
      className={cn(
        "save-button relative z-10 flex size-8 items-center justify-center rounded-full transition-colors",
        blocked ? "text-destructive" : saved ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/10",
        saved && popping && "is-popping",
        className,
      )}
    >
      {blocked ? <HeartOff className="size-4" /> : <Heart className={cn("size-4", saved && "fill-current")} />}
    </button>
  );
}
