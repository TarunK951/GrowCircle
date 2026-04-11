import Link from "next/link";
import { GrowCircleWordmark } from "@/components/brand/GrowCircleWordmark";
import { AppAuthenticatedBody } from "@/components/layout/AppAuthenticatedBody";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 shrink items-center py-1"
            aria-label="Grow Circle home"
          >
            <GrowCircleWordmark className="!h-10 !max-h-10 w-auto max-w-[min(240px,52vw)] sm:!h-11" />
          </Link>
          <Link
            href="/explore"
            className="shrink-0 text-sm font-semibold text-neutral-900 hover:text-primary"
          >
            Explore meets
          </Link>
        </div>
      </header>
      <RequireAuth>
        <AppAuthenticatedBody>{children}</AppAuthenticatedBody>
      </RequireAuth>
    </div>
  );
}
