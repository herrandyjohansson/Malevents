import Image from "next/image";

/** Skåne's coat of arms (credited in SiteFooter, CC BY-SA 3.0). Shown at 248:300, so give it a height. */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/skane-landskapsvapen.svg"
      alt=""
      width={248}
      height={300}
      // A local SVG with no scripts: the image optimizer doesn't take SVG, and needn't.
      unoptimized
      loading="eager"
      className={className}
    />
  );
}
