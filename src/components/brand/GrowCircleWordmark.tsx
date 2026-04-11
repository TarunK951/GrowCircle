import Image from "next/image";
import { cn } from "@/lib/utils";

/** Grow Circle logo — raster wordmark from `/public/brand-grow-circle-logo.png`. */
export function GrowCircleWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand-grow-circle-logo.png"
      alt=""
      width={400}
      height={160}
      sizes="(max-width: 640px) 140px, 180px"
      className={cn("h-9 w-auto sm:h-10", className)}
      priority
    />
  );
}
