import Image from "next/image";

const HERO_BG = "/landing%20bg%20image.jpeg";

export function LandingHero() {
  return (
    <header className="bg-[#f3f3f3] px-2 pt-2 sm:px-3 sm:pt-3">
      <div className="relative isolate h-[58svh] min-h-[360px] w-full overflow-hidden rounded-[18px] sm:min-h-[480px] sm:rounded-[26px] lg:h-[72svh] lg:max-h-[840px]">
        <Image
          src={HERO_BG}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/62 via-black/20 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 flex h-full flex-col justify-end px-3 pb-4 sm:px-8 sm:pb-12 lg:px-12 lg:pb-16">
          <h1 className="max-w-[10.5ch] text-[3rem] font-semibold uppercase leading-[0.9] tracking-[-0.03em] text-white sm:max-w-[12ch] sm:text-6xl lg:text-7xl">
            FIND WHERE YOU BELONG!
          </h1>
        </div>
      </div>
    </header>
  );
}
