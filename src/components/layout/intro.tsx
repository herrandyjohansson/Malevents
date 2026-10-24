"use client";

import { useEffect, useRef, useState } from "react";

import { INTRO_SEEN_KEY } from "@/lib/intro";
import { cn } from "@/lib/utils";

import { UmlautO } from "./umlaut-o";

const WORD = "MÖEVENTS";
/** Glyphs letters cycle through before they lock; Å, Ä and Ö for the city. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ0123456789#%&*+=?";
/** The brand's three aurora colours, for glyphs that are still scrambling. */
const SCRAMBLE_COLORS = ["var(--brand-1)", "var(--brand-2)", "var(--brand-3)"];
/** What the server renders, so the very first paint is already "encrypted". */
const SCRAMBLED = "Ø#ÅV?KÄ7";

/** Delay before the first letter locks, then between letters. */
const FIRST_LOCK_MS = 280;
const LOCK_EVERY_MS = 110;
/** How often scrambling glyphs change. */
const TICK_MS = 45;
/** Each venue name stays this long, of which the first part is spent decrypting it. */
const VENUE_MS = 780;
const VENUE_DECRYPT_MS = 320;
/** Once the events are on screen, letters still scrambling lock this fast, then the curtain lifts. */
const FAST_LOCK_MS = 35;
/** Lifts after this long even if the page never reports its events (a hung request, a slow dev compile). */
const MAX_MS = 10000;
const LEAVE_MS = 750;

/** Malmö's coordinates (Stortorget), set as data at the foot of the screen. */
const COORDINATES = "55.6059° N  13.0007° E";

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

/** `text` with everything after the first `share` of it scrambled (spaces kept). */
function decrypt(text: string, share: number) {
  const cut = Math.floor(text.length * share);
  return text
    .split("")
    .map((c, i) => (i < cut || c === " " ? c : randomGlyph()))
    .join("");
}

/** True once the page's loading skeletons are gone from the main content. */
function contentReady() {
  return !document.querySelector('#content [data-slot="skeleton"]');
}

interface Frame {
  glyphs: string[];
  colors: string[];
  locked: number;
  venue: string;
}

/**
 * The first screen of a visit, lasting exactly as long as the first events
 * take to load. "MÖEVENTS" decrypts letter by letter (inspired by React
 * Bits' Decrypted Text) while, beneath it, the venues the listings come from
 * decrypt one after another: the events really are being gathered from them
 * behind the curtain. The moment the page has events on screen, the letters
 * still scrambling snap into place and the curtain lifts onto them; on a
 * warm cache that is a short flourish. Lifts after MAX_MS regardless. Once
 * per browser session; reduced motion gets the finished word and a fade.
 */
export function Intro({ venues }: { venues: string[] }) {
  const [frame, setFrame] = useState<Frame>(() => ({
    glyphs: SCRAMBLED.split(""),
    colors: SCRAMBLED.split("").map((_, i) => SCRAMBLE_COLORS[i % SCRAMBLE_COLORS.length]),
    locked: 0,
    venue: venues[0] ?? "",
  }));
  const [phase, setPhase] = useState<"playing" | "leaving" | "gone">("playing");
  const started = useRef(0);
  // The root layout re-renders on every refresh (pending sources, map filters), handing a new
  // `venues` array each time; read it through a ref so the effect runs once, on mount.
  const venuesRef = useRef(venues);

  useEffect(() => {
    // Already played this session: the CSS hides it before paint, so there is nothing to run.
    if (document.documentElement.dataset.intro === "seen") return;
    const venues = venuesRef.current;
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Private mode or blocked storage: the intro may simply play again next time.
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    started.current = performance.now();
    // When the events showed up, and how many letters were locked by then.
    let readyAt: number | undefined;
    let lockedAtReady = 0;

    const tick = window.setInterval(() => {
      const elapsed = performance.now() - started.current;
      const paced = Math.max(0, Math.floor((elapsed - FIRST_LOCK_MS) / LOCK_EVERY_MS) + 1);
      if (readyAt === undefined && (contentReady() || elapsed >= MAX_MS)) {
        readyAt = elapsed;
        lockedAtReady = Math.min(WORD.length, paced);
      }
      const rushed = readyAt === undefined ? 0 : lockedAtReady + Math.floor((elapsed - readyAt) / FAST_LOCK_MS) + 1;
      const locked = reduced ? WORD.length : Math.min(WORD.length, Math.max(paced, rushed));
      const slot = Math.floor(elapsed / VENUE_MS);
      const name = venues.length ? venues[slot % venues.length] : "";
      const share = reduced ? 1 : Math.min(1, (elapsed - slot * VENUE_MS) / VENUE_DECRYPT_MS);
      setFrame({
        glyphs: WORD.split("").map((c, i) => (i < locked ? c : randomGlyph())),
        colors: WORD.split("").map(() => SCRAMBLE_COLORS[Math.floor(Math.random() * SCRAMBLE_COLORS.length)]),
        locked,
        venue: decrypt(name, share),
      });

      // Leave once the events are there and the word is whole (immediately, with reduced motion).
      if (readyAt !== undefined && locked === WORD.length) {
        window.clearInterval(tick);
        setFrame((f) => ({ ...f, glyphs: WORD.split(""), locked: WORD.length }));
        setPhase("leaving");
        window.setTimeout(() => {
          setPhase("gone");
          // Hides it through the CSS too, so a remount later in the visit never plays it again.
          document.documentElement.dataset.intro = "seen";
        }, LEAVE_MS);
      }
    }, TICK_MS);
    return () => window.clearInterval(tick);
  }, []);

  if (phase === "gone") return null;
  const whole = frame.locked === WORD.length;

  return (
    <div aria-hidden className={cn("intro-overlay", phase === "leaving" && "intro-leaving")}>
      <div className="intro-aurora">
        <span />
      </div>
      <div className="intro-grain" />

      <div className="intro-stage relative flex flex-col items-center gap-6 px-6 text-center">
        <p className="text-[clamp(3rem,14vw,6rem)] leading-none font-bold tracking-[-0.03em]">
          {WORD.split("").map((letter, i) => {
            const locked = i < frame.locked;
            return (
              <span key={i} className="relative inline-block">
                {/* The real letter holds the slot's width, so scrambling never reflows the word. */}
                <span className={cn("inline-block", locked ? "intro-letter-lock" : "opacity-0")}>
                  {/* The Ö locks as a plain O, then its dots start fading in and out. */}
                  {letter === "Ö" && locked ? <UmlautO delayMs={250} /> : letter}
                </span>
                {!locked && (
                  <span className="absolute inset-0 text-center opacity-80" style={{ color: frame.colors[i] }}>
                    {frame.glyphs[i]}
                  </span>
                )}
              </span>
            );
          })}
        </p>
        <p className="text-muted-foreground min-h-[1.5em] text-[clamp(0.95rem,2.6vw,1.15rem)]">
          {whole && phase === "leaving" ? (
            <span className="text-foreground">What&apos;s on in Malmö</span>
          ) : (
            <>
              Gathering what&apos;s on from <span className="text-foreground font-medium">{frame.venue}</span>
            </>
          )}
        </p>
      </div>

      <p className="text-muted-foreground absolute bottom-[max(2rem,env(safe-area-inset-bottom))] text-xs tracking-[0.12em] tabular-nums">
        {COORDINATES}
      </p>
    </div>
  );
}
