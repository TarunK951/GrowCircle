"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

/**
 * Reference-style split: hero left (50%), form right (50%), tall rounded image;
 * form vertically centered in the right column (scrolls if content is tall).
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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-3 pb-4 pt-14 sm:px-5 sm:pb-6 md:px-8 md:pb-8 md:pt-16">
        <div className="flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 overflow-hidden md:h-[calc(100svh-6rem)] md:max-h-[calc(100svh-6rem)] md:flex-row md:items-stretch md:gap-8 lg:max-w-7xl lg:gap-10">
          {/*
            Hero: fixed row height on md+ so image matches form column height (reference: tall panel).
            `absolute inset-0` + fill avoids min-h math fighting flex and keeps next/image happy.
          */}
          <section
            aria-hidden
            className="relative hidden min-h-0 w-full overflow-hidden rounded-3xl bg-neutral-200/30 shadow-sm md:block md:h-full md:min-h-0 md:w-1/2 md:max-w-[50%]"
          >
            <div className="absolute inset-0">
              <Image
                src="/auth/login-hero.png"
                alt=""
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 767px) 0px, 50vw"
              />
            </div>
          </section>

          {/* Right 50%: form — centered in column */}
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col justify-start overflow-y-auto overflow-x-hidden overscroll-contain px-2 pb-8 sm:px-4 md:h-full md:w-1/2 md:max-w-[50%] md:justify-center md:px-10 md:pb-10 md:pt-4 lg:px-14">
            <div className="mx-auto w-full">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
