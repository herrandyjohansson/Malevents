"use client";

import { useState } from "react";

/**
 * An image from a venue's own site. If it fails (moved, hotlink-blocked) it
 * hides itself so whatever is behind it shows instead of a broken icon.
 * Event images come from many hosts, so next/image's remotePatterns can't list them all.
 */
export function RemoteImage({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
      // The image may have failed before React hydrated and attached onError.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailed(true);
      }}
    />
  );
}
