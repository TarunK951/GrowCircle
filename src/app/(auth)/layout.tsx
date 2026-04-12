"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GrowCircleWordmark } from "@/components/brand/GrowCircleWordmark";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSplitAuth = pathname === "/login" || pathname === "/signup";
  /** Full-viewport OAuth return — avoid narrow column + header flash while tokens/profile load */
  const isGoogleOAuthCallback =
    pathname === "/auth/google/callback" ||
    pathname?.startsWith("/auth/google/callback/");

  return (
    <div
      className="flex min-h-screen flex-col bg-canvas"
    >
      {!isSplitAuth && !isGoogleOAuthCallback && (
        <header className="sticky top-0 z-50 border-b border-primary/10 bg-canvas/85 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex h-10 max-w-6xl items-center">
            <Link
              href="/"
              className="inline-flex shrink-0 items-center"
              aria-label="Grow Circle home"
            >
              <GrowCircleWordmark alt="" className="h-9 max-w-[200px] sm:h-10" />
            </Link>
          </div>
        </header>
      )}
      {isSplitAuth ? (
        <div className="flex h-svh min-h-0 w-full flex-1 flex-col overflow-hidden overscroll-none">
          <AuthSplitLayout>{children}</AuthSplitLayout>
        </div>
      ) : isGoogleOAuthCallback ? (
        <div className="flex min-h-dvh w-full flex-1 flex-col items-center justify-center">
          {children}
        </div>
      ) : (
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      )}
    </div>
  );
}
