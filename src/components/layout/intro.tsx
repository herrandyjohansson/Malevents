"use client";

import { useEffect, useRef, useState } from "react";

import { INTRO_SEEN_KEY } from "@/lib/intro";
import { cn } from "@/lib/utils";

const WORD = "MALEVENTS";
/** Glyphs the letters cycle through before they lock; Å, Ä and Ö for the city. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ0123456789#%&*+=?";
/** What the server renders before the animation starts, so the first paint is already "encrypted". */
const SCRAMBLED = "Ø#ÅV?KÄ7S";

/** Delay before the first letter locks, then between letters. */
const FIRST_LOCK_MS = 260;
const LOCK_EVERY_MS = 105;
/** How often unlocked letters change glyph. */
const TICK_MS = 45;
/** Shown at least this long (the word fully revealed), at most this long (data or not). */
const MIN_MS = FIRST_LOCK_MS + LOCK_EVERY_MS * WORD.length + 350;
const MAX_MS = 6000;
const LEAVE_MS = 550;

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

/** True once the page's loading skeletons are gone from the main content. */
function contentReady() {
  return !document.querySelector('#content [data-slot="skeleton"]');
}

/**
 * The first screen of a visit: "MALEVENTS" decrypting letter by letter
 * (inspired by React Bits' Decrypted Text) while the events load behind it.
 * It leaves as soon as the page has something to show, once the word is
 * whole, and after MAX_MS at the latest; the data keeps loading regardless.
 * Once per browser session; a plain fade for reduced motion.
 */
export function Intro() {
  const [letters, setLetters] = useState(() => SCRAMBLED.split(""));
  const [locked, setLocked] = useState(0);
  const [phase, setPhase] = useState<"playing" | "leaving" | "gone">("playing");
  const started = useRef(0);

  useEffect(() => {
    // Already played this session: the CSS hides it before paint, so there is nothing to run.
    if (document.documentElement.dataset.intro === "seen") return;
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Private mode or blocked storage: the intro may simply play again next time.
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    started.current = performance.now();

    const tick = window.setInterval(() => {
      const elapsed = performance.now() - started.current;
      const lockedNow = reduced
        ? WORD.length
        : Math.max(0, Math.min(WORD.length, Math.floor((elapsed - FIRST_LOCK_MS) / LOCK_EVERY_MS) + 1));
      setLocked(lockedNow);
      setLetters(WORD.split("").map((c, i) => (i < lockedNow ? c : randomGlyph())));

      const ready = elapsed >= (reduced ? 400 : MIN_MS) && contentReady();
      if (ready || elapsed >= MAX_MS) {
        window.clearInterval(tick);
        setLetters(WORD.split(""));
        setLocked(WORD.length);
        setPhase("leaving");
        window.setTimeout(() => setPhase("gone"), LEAVE_MS);
      }
    }, TICK_MS);
    return () => window.clearInterval(tick);
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      className={cn(
        "intro-overlay bg-background fixed inset-0 z-[3000] flex flex-col items-center justify-center gap-5 px-4",
        phase === "leaving" && "intro-leaving",
      )}
    >
      <p className="font-mono text-[clamp(2.25rem,9vw,6rem)] leading-none font-semibold tracking-[0.08em]">
        {letters.map((c, i) => (
          <span
            key={i}
            className={cn(
              "inline-block transition-[color,opacity] duration-500 ease-out",
              i < locked ? "text-foreground" : "text-primary/55",
            )}
          >
            {c}
          </span>
        ))}
      </p>
      <p
        className={cn(
          "text-muted-foreground text-sm transition-opacity duration-500 sm:text-base",
          locked === WORD.length ? "opacity-100" : "opacity-0",
        )}
      >
        What&apos;s on in Malmö
      </p>
    </div>
  );
}
