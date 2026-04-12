"use client";

import { usePathname } from "next/navigation";
import { MarketingNav } from "@/components/layout/MarketingNav";
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
      {!isSplitAuth && !isGoogleOAuthCallback && <MarketingNav />}
      {isSplitAuth ? (
        <div className="flex h-svh min-h-0 w-full flex-1 flex-col overflow-hidden overscroll-none">
          <AuthSplitLayout>{children}</AuthSplitLayout>
        </div>
      ) : isGoogleOAuthCallback ? (
        <div className="flex min-h-dvh w-full flex-1 flex-col items-center justify-center">
          {children}
        </div>
      ) : (
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4 pb-12 pt-24 sm:px-6 sm:pt-28">
          <div className="w-full max-w-md">{children}</div>
        </div>
      )}
    </div>
  );
}
