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
            <Logo className="h-7 w-auto" />
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

/** Credits for the parts of the site others made: the coat of arms in the logo and tab icon. */
export function SiteFooter() {
  const link = "hover:text-foreground underline decoration-white/20 underline-offset-2 hover:decoration-current";
  return (
    <footer className="text-muted-foreground mx-auto w-full max-w-7xl px-4 py-6 text-xs sm:px-6">
      Coat of arms of Skåne by Havsjö, after Leonid 2,{" "}
      <a href="https://commons.wikimedia.org/wiki/File:Sk%C3%A5ne_landskapsvapen.svg" className={link}>
        Wikimedia Commons
      </a>
      ,{" "}
      <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="license" className={link}>
        CC BY-SA 3.0
      </a>{" "}
      (scaling box added).
    </footer>
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
