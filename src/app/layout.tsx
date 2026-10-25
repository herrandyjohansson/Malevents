import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Intro } from "@/components/layout/intro";
import { Backdrop, SiteFooter, SiteHeader } from "@/components/layout/site-header";

import { LIVE_MODE } from "@/lib/events/config";
import { SOURCE_META } from "@/lib/events/sources";
import { INTRO_SEEN_KEY } from "@/lib/intro";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MÖEVENTS – What's on in Malmö",
    template: "%s · MÖEVENTS",
  },
  description:
    "What's on in Malmö tonight, this weekend and beyond: concerts, stage, clubs, sport and more across the city's venues, by time and area.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0b12",
};

/** The places the intro names while events load: real sources, not listing sites or demo stand-ins. */
const INTRO_VENUES = SOURCE_META.filter((s) => (LIVE_MODE ? !s.demo : true) && !s.name.includes("·")).map((s) => s.name);

export default function RootLayout({ children, sheet }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the intro script below sets data-intro on <html> before React hydrates.
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="relative isolate flex min-h-full flex-col font-sans">
        <a
          href="#content"
          className="bg-primary text-primary-foreground sr-only z-[2000] rounded-full px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        {/* Before first paint: skip the intro for the rest of the session once it has played. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)}))document.documentElement.dataset.intro="seen"}catch(e){}`,
          }}
        />
        <Intro venues={INTRO_VENUES} />
        <Backdrop />
        <SiteHeader />
        <div id="content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
        <SiteFooter />
        {/* An event opened from a list renders here, as a sheet over the page (see app/@sheet). */}
        {sheet}
      </body>
    </html>
  );
}
