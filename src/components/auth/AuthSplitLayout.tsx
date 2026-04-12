"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

/**
 * Public asset (large PNG). Served without the image optimizer — very large files can fail or
 * time out through `/_next/image`, which shows as a blank hero.
 */
const AUTH_HERO_SRC = "/Group%20662.png";

/** Matches rendered hero width: full-bleed strip on small screens, half viewport on md+. */
const AUTH_HERO_SIZES =
  "(max-width: 767px) 100vw, (min-width: 1536px) min(920px, 50vw), 50vw";

/**
 * Split auth surface: decorative image on the left (50% width on md+), form on the right (50%).
 * Close control returns to home.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-white md:min-h-svh md:flex-row md:items-stretch">
      {/* Hero: one image — mobile strip + desktop portrait frame */}
      <div className="relative w-full shrink-0 md:flex md:min-h-0 md:w-1/2 md:min-w-0 md:flex-col md:items-center md:justify-center md:bg-white md:px-5 md:py-5 lg:px-6 lg:py-6 xl:px-8 xl:py-8">
        <div className="relative h-52 w-full max-w-[920px] overflow-hidden sm:h-60 md:h-[min(90svh,920px)] md:min-h-[min(400px,90svh)] md:w-full md:rounded-[28px] md:shadow-[0_2px_8px_rgba(15,23,42,0.08)] lg:rounded-[32px]">
          <Image
            src={AUTH_HERO_SRC}
            alt=""
            fill
            unoptimized
            className="object-cover object-center"
            sizes={AUTH_HERO_SIZES}
            priority
          />
        </div>
      </div>

      {/* Form column — 50% width on md+ to match hero column */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white md:w-1/2 md:flex-none">
        <Link
          href="/"
          className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/80 bg-white/95 text-neutral-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-neutral-950 sm:right-4 sm:top-4"
          aria-label="Close and return home"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </Link>

        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto overscroll-contain px-4 pb-8 pt-14 sm:px-6 sm:pb-10 sm:pt-16 md:px-8 md:py-8 lg:px-10 lg:py-10 xl:px-14">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
