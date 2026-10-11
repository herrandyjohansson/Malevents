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
  description: "Concerts, exhibitions, sports, markets and more in Malmö, gathered from many sources in one place.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0b12",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="relative isolate flex min-h-full flex-col font-sans">
        <Backdrop />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
