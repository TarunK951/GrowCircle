"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSplitAuth = pathname === "/login" || pathname === "/signup";

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col",
        isSplitAuth ? "bg-[#FBFCF8]" : "bg-canvas",
      )}
    >
      {!isSplitAuth && (
        <header className="sticky top-0 z-50 border-b border-primary/10 bg-canvas/85 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex h-10 max-w-6xl items-center">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-primary"
            >
              ConnectSphere
            </Link>
          </div>
        </header>
      )}
      {isSplitAuth ? (
        <div className="flex min-h-dvh min-h-0 w-full flex-1 flex-col">{children}</div>
      ) : (
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      )}
    </div>
  );
}
