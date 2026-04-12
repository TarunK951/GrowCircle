"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

/** Public asset — filename contains a space; encode for the URL. */
const AUTH_HERO_SRC = "/Group%20662.png";

/**
 * Split auth surface: decorative image on the left (~45% width, tall frame), form on the right.
 * Close control returns to home.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-white md:min-h-svh md:flex-row md:items-stretch">
      {/* Mobile: taller hero strip */}
      <div className="relative h-52 w-full shrink-0 overflow-hidden sm:h-60 md:hidden">
        <Image
          src={AUTH_HERO_SRC}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>

      {/* Desktop: left image — ~45% width, image frame nearly full viewport height (Figma proportions) */}
      <div className="relative hidden min-h-0 shrink-0 md:flex md:w-[45%] md:min-w-0 md:flex-col md:items-center md:justify-center md:bg-white md:px-8 md:py-8 lg:px-12 lg:py-10 xl:px-14 xl:py-12">
        {/* Portrait frame ~3:4, Figma-like scale: tall, up to 800px wide / 920px tall */}
        <div
          className="relative mx-auto h-[min(90svh,920px)] w-[min(100%,min(800px,calc(min(90svh,920px)*3/4)))] shrink-0 overflow-hidden rounded-[28px] shadow-[0_2px_8px_rgba(15,23,42,0.08)] lg:rounded-[32px]"
        >
          <Image
            src={AUTH_HERO_SRC}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 1536px) 800px, 45vw"
            priority
          />
        </div>
      </div>

      {/* Form column */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <Link
          href="/"
          className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/80 bg-white/95 text-neutral-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-neutral-950 sm:right-4 sm:top-4"
          aria-label="Close and return home"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </Link>

        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto overscroll-contain px-4 pb-8 pt-14 sm:px-8 sm:pb-12 sm:pt-16 md:px-12 md:py-10 lg:px-16 lg:py-12 xl:px-20">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
