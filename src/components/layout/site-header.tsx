import Link from "next/link";
import { Suspense } from "react";

import { NavTabs, NavTabsFallback } from "./nav-tabs";

export function SiteHeader() {
  return (
    <header className="bg-background/70 sticky top-0 z-[1000] border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden
            className="from-primary size-6 rounded-md bg-gradient-to-br to-sky-400 shadow-[0_0_20px_-4px] shadow-primary/60"
          />
          Malevents
        </Link>
        <Suspense fallback={<NavTabsFallback />}>
          <NavTabs />
        </Suspense>
      </div>
    </header>
  );
}
