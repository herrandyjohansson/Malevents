import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "./logo";
import { UmlautO } from "./umlaut-o";
import { HeaderNav, HeaderNavFallback, MobileNav, MobileNavFallback } from "./nav-tabs";

export function SiteHeader() {
  return (
    <>
      <header className="glass sticky top-0 z-[1000] border-b">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="MÖEVENTS" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <Logo className="size-7" />
            <span className="text-[15px]">
              M<UmlautO />
              EVENTS
            </span>
          </Link>
          <Suspense fallback={<HeaderNavFallback />}>
            <HeaderNav />
          </Suspense>
        </div>
      </header>
      <Suspense fallback={<MobileNavFallback />}>
        <MobileNav />
      </Suspense>
    </>
  );
}

/** Slow colour fields and a dot grid behind the top of every page. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem]">
      <div className="aurora">
        <span />
      </div>
      <div className="dot-grid absolute inset-0" />
    </div>
  );
}
