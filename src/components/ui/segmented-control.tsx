"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Every option visible as a button in one track, with a glowing pill that
 * springs to the picked one. A dropdown hides the choices; this shows them.
 * Scrolls sideways on narrow screens and keeps the picked option in view.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentOption<T>[];
  /** Null when no option is picked (the pill hides). */
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const active = track.querySelector<HTMLElement>('[aria-checked="true"]');
      setPill(active ? { x: active.offsetLeft, w: active.offsetWidth } : null);
      if (active) {
        // Bring the picked option into view without scrolling the page.
        const left = active.offsetLeft - 8;
        const right = active.offsetLeft + active.offsetWidth + 8 - track.clientWidth;
        if (track.scrollLeft > left) track.scrollTo({ left, behavior: "smooth" });
        else if (track.scrollLeft < right) track.scrollTo({ left: right, behavior: "smooth" });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [value]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length];
    onChange(next.value);
    trackRef.current?.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
  }

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        "no-scrollbar relative flex h-9 items-center gap-0.5 overflow-x-auto rounded-full border bg-white/[0.03] p-0.5",
        className,
      )}
    >
      <span
        aria-hidden
        className="tab-indicator bg-primary/25 border-primary/60 absolute top-0.5 bottom-0.5 left-0 rounded-full border shadow-[0_0_18px_-6px] shadow-primary"
        style={{ transform: `translateX(${pill?.x ?? 0}px)`, width: pill?.w ?? 0, opacity: pill ? 1 : 0 }}
      />
      {options.map(({ value: v, label: text, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            data-value={v}
            tabIndex={active || (value === null && v === options[0].value) ? 0 : -1}
            onClick={() => onChange(v)}
            className={cn(
              "relative flex h-full shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium whitespace-nowrap transition-colors active:scale-95",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {text}
          </button>
        );
      })}
    </div>
  );
}
