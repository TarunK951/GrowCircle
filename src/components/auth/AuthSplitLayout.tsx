import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative box-border flex min-h-dvh w-full flex-1 flex-col p-4 sm:p-5 md:p-6">
      <Link
        href="/"
        className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200/80 bg-[#FBFCF8]/95 text-neutral-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-neutral-950 sm:right-5 sm:top-5 md:right-6 md:top-6"
        aria-label="Close and return home"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </Link>

      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-stretch md:gap-6 lg:gap-8">
        <section className="relative h-[min(200px,28vh)] max-h-[220px] w-full shrink-0 overflow-hidden rounded-2xl bg-neutral-200/30 md:max-h-none md:min-h-full md:w-[48%] md:flex-none md:self-stretch md:rounded-2xl">
          <Image
            src="/auth/login-hero.png"
            alt=""
            fill
            className="object-cover object-[center_35%]"
            priority
            sizes="(max-width: 767px) 100vw, 48vw"
          />
        </section>
        <div className="flex min-h-0 flex-1 flex-col justify-center px-2 py-6 sm:px-4 md:min-w-0 md:max-w-xl md:flex-none md:px-8 md:py-4 lg:pl-12 lg:pr-16 xl:pl-16">
          {children}
        </div>
      </div>
    </div>
  );
}
