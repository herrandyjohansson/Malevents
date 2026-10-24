import type { CSSProperties } from "react";

/**
 * The wordmark's Ö: one letter that keeps switching between O and Ö. An Ö
 * is laid over a plain O and faded in and out; the two share the same body,
 * so only the dots appear and disappear. Reduced motion shows a still Ö.
 */
export function UmlautO({ delayMs = 400 }: { delayMs?: number }) {
  return (
    <span aria-hidden className="umlaut-o" style={{ "--umlaut-delay": `${delayMs}ms` } as CSSProperties}>
      <span className="umlaut-o-base">O</span>
      <span className="umlaut-o-dots">Ö</span>
    </span>
  );
}
