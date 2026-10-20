"use client";

import { useState, type PointerEvent } from "react";

const WIDTH = 240;
const HEIGHT = 44;
/** Room for the end dot and its ring, so they aren't clipped at the edges. */
const PAD = 6;

/**
 * A small single-series trend line: 2px line over a 10% wash, the latest value
 * marked with a ringed dot. Hovering (or focusing and using arrow keys) shows
 * the value and label at that point. The numbers are also in the stream below,
 * so the tooltip never is the only way to read them.
 */
export function Sparkline({
  points,
  label,
}: {
  /** `display` is the value as text: formatting happens on the server, since functions can't be passed here. */
  points: { value: number; display: string; label: string }[];
  /** What the line shows, for screen readers. */
  label: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length < 2) return <p className="text-muted-foreground text-xs">Not enough data for a trend yet</p>;

  const max = Math.max(...points.map((p) => p.value)) || 1;
  const highest = points.find((p) => p.value === max) ?? points[0];
  const x = (i: number) => PAD + (i / (points.length - 1)) * (WIDTH - PAD * 2);
  const y = (v: number) => HEIGHT - PAD - (v / max) * (HEIGHT - PAD * 2);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${HEIGHT - PAD} L${x(0)},${HEIGHT - PAD} Z`;
  const last = points.length - 1;
  const shown = active ?? last;

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - box.left) / box.width;
    setActive(Math.max(0, Math.min(last, Math.round(ratio * last))));
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-11 w-full overflow-visible outline-none"
        role="img"
        aria-label={`${label}: ${points.length} values, latest ${points[last].display}, highest ${highest.display}`}
        tabIndex={0}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setActive(Math.max(0, shown - 1));
          if (e.key === "ArrowRight") setActive(Math.min(last, shown + 1));
        }}
      >
        <path d={area} className="fill-primary/10" />
        <path d={line} className="stroke-primary fill-none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {active !== null && (
          <line x1={x(active)} x2={x(active)} y1={PAD / 2} y2={HEIGHT - PAD} className="stroke-muted-foreground/50" strokeWidth={1} />
        )}
        <circle cx={x(shown)} cy={y(points[shown].value)} r={4} className="fill-primary stroke-card" strokeWidth={2} />
      </svg>
      {active !== null && (
        <div
          role="status"
          className="bg-popover text-popover-foreground pointer-events-none absolute -top-9 z-10 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-md"
          style={{ left: `${(x(active) / WIDTH) * 100}%` }}
        >
          <span className="font-semibold">{points[active].display}</span>
          <span className="text-muted-foreground"> · {points[active].label}</span>
        </div>
      )}
    </div>
  );
}
