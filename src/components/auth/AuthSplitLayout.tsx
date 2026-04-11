"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

/**
 * Login/signup split: centered card (max-width), no outer page scroll,
 * hero + form share one column row; long forms scroll inside the right panel only.
 */
export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
      <Link
        href="/"
        className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/80 bg-canvas/95 text-neutral-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-neutral-950 sm:right-4 sm:top-4 md:right-6 md:top-6"
        aria-label="Close and return home"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </Link>

      {/* Centers the split on wide viewports; pt clears the close control */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-3 pb-4 pt-14 sm:px-5 sm:pb-6 md:px-8 md:pb-8 md:pt-16">
        <div className="flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 overflow-hidden md:max-h-[calc(100svh-6rem)] md:flex-row md:items-stretch md:gap-8 lg:max-w-7xl lg:gap-10">
          {/* Hero: larger share (≈58%) so image reads bigger; form ≈42% */}
          <section
            aria-hidden
            className="relative hidden min-h-0 w-full overflow-hidden rounded-2xl bg-neutral-200/30 md:flex md:h-full md:w-[58%] md:max-w-[58%] md:flex-col md:rounded-2xl"
          >
            <div className="relative min-h-0 w-full flex-1 md:min-h-[min(32rem,calc(100svh-8rem))]">
              <Image
                src="/auth/login-hero.png"
                alt=""
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 767px) 0px, 58vw"
              />
            </div>
          </section>

          <div className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col justify-start overflow-y-auto overflow-x-hidden overscroll-contain px-2 pb-8 sm:px-4 md:mx-0 md:h-full md:w-[42%] md:max-w-[42%] md:px-6 md:pb-10 md:pr-10 md:pt-2 lg:px-8 lg:pr-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
