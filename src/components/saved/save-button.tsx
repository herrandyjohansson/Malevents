"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

import { toggleSaved, useSavedEvents, type SavedEvent } from "@/lib/saved";
import { cn } from "@/lib/utils";

/** Heart toggle for one event. It pops and throws a ring of sparks when you save. */
export function SaveButton({
  event,
  className,
}: {
  event: Omit<SavedEvent, "savedAt">;
  className?: string;
}) {
  const saved = useSavedEvents().some((e) => e.id === event.id);
  // Only animate on the click that saves, not every time a saved heart renders.
  const [popping, setPopping] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${event.title} from saved` : `Save ${event.title}`}
      title={saved ? "Saved" : "Save"}
      onClick={() => {
        setPopping(!saved);
        toggleSaved(event);
      }}
      onAnimationEnd={(e) => e.animationName === "heart-sparks" && setPopping(false)}
      className={cn(
        "save-button relative z-10 flex size-8 items-center justify-center rounded-full transition-colors",
        saved ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/10",
        saved && popping && "is-popping",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} />
    </button>
  );
}
