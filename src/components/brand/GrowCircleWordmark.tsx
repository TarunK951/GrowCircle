import { cn } from "@/lib/utils";

/** Grow Circle logo — `/public/brand-grow-circle-logo.png` (transparent PNG). */
export function GrowCircleWordmark({ className }: { className?: string }) {
  return (
    // Native img: reliable in flex/nav; avoids Next/Image `fill` sizing edge cases.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand-grow-circle-logo.png"
      alt=""
      width={320}
      height={128}
      decoding="async"
      fetchPriority="high"
      className={cn(
        "block h-8 w-auto max-w-[min(240px,52vw)] object-contain object-left sm:h-9 md:h-10",
        "[image-rendering:auto]",
        className,
      )}
    />
  );
}
