import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <div className="flex min-h-[calc(100dvh-4.5rem)] w-full flex-col lg:min-h-[calc(100vh-4.5rem)] lg:flex-row lg:items-stretch">
        <section className="relative mx-4 mt-6 min-h-[min(42vh,320px)] shrink-0 overflow-hidden rounded-2xl bg-neutral-200/30 lg:mx-0 lg:mt-0 lg:min-h-0 lg:w-[48%] lg:max-w-none lg:rounded-none lg:rounded-r-[1.75rem]">
          <Image
            src="/auth/login-hero.png"
            alt=""
            fill
            className="object-cover object-[center_35%]"
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
        </section>
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:min-w-0 lg:max-w-xl lg:flex-none lg:px-16 xl:pl-20">
          <LoginForm />
        </div>
      </div>
    </Suspense>
  );
}
