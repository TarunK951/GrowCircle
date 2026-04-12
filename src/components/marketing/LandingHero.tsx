import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const HERO_BG = "/landing%20bg%20image.jpeg";

export function LandingHero() {
  return (
    <header className="relative isolate min-h-[min(100svh,880px)] w-full overflow-hidden rounded-b-[32px]">
      <Image
        src={HERO_BG}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-[min(100svh,880px)] flex-col">
        <nav
          aria-label="Primary"
          className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-5 sm:px-8 lg:px-12 lg:py-7"
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand-grow-circle-logo.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
            />
            <span className="text-sm font-bold tracking-[0.12em] sm:text-base">
              GROW CIRCLE
            </span>
          </Link>
          <div className="order-3 flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm font-medium text-white md:order-0 md:w-auto">
            <Link href="/explore" className="hover:opacity-90">
              Discover events
            </Link>
            <Link href="/host" className="hover:opacity-90">
              Host event
            </Link>
          </div>
          <Link
            href="/signup"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-black py-2.5 pl-5 pr-1.5 text-sm font-semibold text-white shadow-lg hover:bg-black/90"
          >
            Get Started
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
              <ArrowUpRight className="h-4 w-4 text-black" aria-hidden />
            </span>
          </Link>
        </nav>
        <div className="mt-auto flex flex-1 flex-col justify-end px-4 pb-12 pt-8 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
          <h1 className="max-w-[18ch] text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl md:max-w-[22ch] md:text-6xl lg:text-7xl">
            FIND WHERE YOU BELONG!
          </h1>
        </div>
      </div>
    </header>
  );
}
