import { useId } from "react";

/** The Malevents mark: a gradient tile with a map pin cut into a spark. */
export function Logo({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand-1)" />
          <stop offset="0.6" stopColor="var(--brand-2)" />
          <stop offset="1" stopColor="var(--brand-3)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-g)`} />
      <path
        d="M16 7.5c-3.6 0-6.5 2.8-6.5 6.3 0 4.6 5.4 9.6 6 10.1.3.3.7.3 1 0 .6-.5 6-5.5 6-10.1 0-3.5-2.9-6.3-6.5-6.3Z"
        fill="oklch(0.12 0.014 278 / 0.85)"
      />
      <path d="m16 10.6.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z" fill="white" />
    </svg>
  );
}
