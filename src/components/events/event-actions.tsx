"use client";

import { CalendarPlus, Check, Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { downloadIcs, type IcsEvent } from "@/lib/ics";
import { toggleSaved, useIsSaved, type SavedEvent } from "@/lib/saved";
import { cn } from "@/lib/utils";

const actionClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50";

/**
 * Save, add to calendar and share for one event. Each says what happened,
 * in text next to the button and to screen readers, not only by changing
 * an icon.
 */
export function EventActions({ saved: snapshot, ics }: { saved: Omit<SavedEvent, "savedAt">; ics: IcsEvent }) {
  const isSaved = useIsSaved(snapshot);
  const [message, setMessage] = useState<React.ReactNode>(null);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: snapshot.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Link copied.");
    } catch {
      // Closing the share sheet rejects too; nothing to report then.
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={isSaved}
          onClick={() => {
            toggleSaved(snapshot);
            setMessage(
              isSaved ? (
                "Removed from Saved."
              ) : (
                <>
                  Saved.{" "}
                  <Link href="/saved" className="text-foreground underline underline-offset-2">
                    See your saved events
                  </Link>
                </>
              ),
            );
          }}
          className={cn(actionClass, isSaved && "border-primary/50 bg-primary/15 text-foreground")}
        >
          <Heart className={cn("size-4", isSaved && "fill-primary text-primary")} aria-hidden />
          {isSaved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            downloadIcs([ics], `${ics.title.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60) || "event"}.ics`);
            setMessage("Calendar file downloaded. Open it to add the event.");
          }}
          className={actionClass}
        >
          <CalendarPlus className="size-4" aria-hidden />
          Add to calendar
        </button>
        <button type="button" onClick={share} className={actionClass}>
          <Share2 className="size-4" aria-hidden />
          Share
        </button>
      </div>
      <p className="text-muted-foreground flex min-h-5 items-center gap-1.5 text-sm" aria-live="polite">
        {message && <Check className="text-success size-4 shrink-0" aria-hidden />}
        {message}
      </p>
    </div>
  );
}
