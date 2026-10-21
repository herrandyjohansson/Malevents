import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Backdrop, SiteHeader } from "@/components/layout/site-header";

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
    default: "Malevents – What's on in Malmö",
    template: "%s · Malevents",
  },
  description:
    "What's on in Malmö tonight, this weekend and beyond: concerts, stage, clubs, sport and more across the city's venues, by time and area.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0b12",
};

export default function RootLayout({ children, sheet }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="relative isolate flex min-h-full flex-col font-sans">
        <a
          href="#content"
          className="bg-primary text-primary-foreground sr-only z-[2000] rounded-full px-4 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Backdrop />
        <SiteHeader />
        <div id="content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
        {/* An event opened from a list renders here, as a sheet over the page (see app/@sheet). */}
        {sheet}
      </body>
    </html>
  );
}
