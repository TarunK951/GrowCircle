import Image from "next/image";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col md:min-h-dvh md:flex-row md:items-stretch">
      <section className="relative mx-4 mt-4 h-[min(200px,28vh)] max-h-[220px] shrink-0 overflow-hidden rounded-2xl bg-neutral-200/30 md:mx-0 md:mt-0 md:h-auto md:min-h-dvh md:max-h-none md:w-[48%] md:flex-none md:self-stretch md:rounded-none md:rounded-r-[1.75rem]">
        <Image
          src="/auth/login-hero.png"
          alt=""
          fill
          className="object-cover object-[center_35%]"
          priority
          sizes="(max-width: 767px) 100vw, 48vw"
        />
      </section>
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:min-w-0 md:max-w-xl md:flex-none md:px-16 xl:pl-20">
        {children}
      </div>
    </div>
  );
}
