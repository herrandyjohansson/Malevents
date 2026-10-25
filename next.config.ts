import type { NextConfig } from "next";

import { venueAliasRedirects } from "./src/lib/events/venues";

/**
 * Headers that need no per-request nonce. A script-src CSP is left out: it
 * would need nonces for Next's inline scripts, and MapLibre and event images
 * load from many hosts.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Vercel already sends this on its domains; set here so it doesn't depend on the host.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Week and Calendar used to be tabs; both now live in Discover. Query
  // strings (shared filters) are passed through to the destination. Pages
  // of another name for a venue (Slagthusets Teater) go to the venue's page.
  async redirects() {
    return [
      { source: "/week", destination: "/?when=week", permanent: true },
      { source: "/calendar", destination: "/?view=calendar", permanent: true },
      ...venueAliasRedirects(),
    ];
  },
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Keep visited pages in the browser's router cache for 30 s, so hopping
    // between Events, Map and Calendar doesn't re-request each page.
    staleTimes: { dynamic: 30 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
