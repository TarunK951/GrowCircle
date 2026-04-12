import Image from "next/image";

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
      <div className="relative z-10 flex min-h-[min(100svh,880px)] flex-col justify-end px-4 pb-12 pt-8 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <h1 className="max-w-[18ch] text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl md:max-w-[22ch] md:text-6xl lg:text-7xl">
          FIND WHERE YOU BELONG!
        </h1>
      </div>
    </header>
  );
}
