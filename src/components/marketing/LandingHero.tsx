import Image from "next/image";

const HERO_BG = "/landing%20bg%20image.jpeg";

export function LandingHero() {
  return (
    <header className="bg-[#f3f3f3] px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
      <div className="relative isolate flex min-h-[calc(100svh-1rem)] w-full flex-col justify-end overflow-hidden rounded-[18px] sm:min-h-[calc(100svh-1.5rem)] sm:rounded-[26px]">
        <Image
          src={HERO_BG}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/68 via-black/22 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 w-full px-3 pb-6 sm:px-8 sm:pb-12 lg:px-12 lg:pb-16">
          <h1 className="max-w-[10.5ch] text-[3rem] font-semibold uppercase leading-[0.9] tracking-[-0.03em] text-white sm:max-w-[12ch] sm:text-6xl lg:text-7xl">
            FIND WHERE YOU BELONG!
          </h1>
        </div>
      </div>
    </header>
  );
}
