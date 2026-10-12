import { CATEGORY_COLORS, CATEGORY_EMOJI } from "@/lib/events/format";
import type { EventCategory } from "@/lib/events/types";
import { cn } from "@/lib/utils";

import { RemoteImage } from "./remote-image";

/**
 * An event's picture, over a category-coloured placeholder that shows
 * through when there is no image or it fails to load.
 */
export function EventArt({
  src,
  category,
  className,
  emojiClassName,
}: {
  src?: string;
  category: EventCategory;
  className?: string;
  emojiClassName?: string;
}) {
  const color = CATEGORY_COLORS[category];
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: `radial-gradient(120% 90% at 20% 10%, ${color}55, transparent 60%), radial-gradient(90% 90% at 90% 100%, ${color}33, transparent 60%), var(--card)`,
        }}
      >
        <span className={cn("text-5xl opacity-80 drop-shadow-lg", emojiClassName)}>{CATEGORY_EMOJI[category]}</span>
      </div>
      {src && (
        <RemoteImage
          src={src}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      )}
    </div>
  );
}
