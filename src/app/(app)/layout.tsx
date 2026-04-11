import Link from "next/link";
import { GrowCircleWordmark } from "@/components/brand/GrowCircleWordmark";
import { AppAuthenticatedBody } from "@/components/layout/AppAuthenticatedBody";
import { AppHeaderProfileMenu } from "@/components/layout/AppHeaderProfileMenu";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex min-w-0 shrink-0 items-center py-1"
            aria-label="Grow Circle home"
          >
            <GrowCircleWordmark className="!h-10 !max-h-10 w-auto max-w-[min(200px,42vw)] sm:!h-11" />
          </Link>
          <AppHeaderProfileMenu />
        </div>
      </header>
      <RequireAuth>
        <AppAuthenticatedBody>{children}</AppAuthenticatedBody>
      </RequireAuth>
    </div>
  );
}
