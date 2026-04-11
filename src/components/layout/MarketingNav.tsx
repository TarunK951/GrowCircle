"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import GlassyButton from "@/components/ui/GlassyButton";

const links = [
  { href: "/discover", label: "Discover" },
  { href: "/host-a-meet", label: "Host a meet" },
  { href: "/join-a-meet", label: "Join a meet" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-primary"
        >
          ConnectSphere
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-primary/10 hover:text-primary",
                pathname === l.href && "bg-primary/10 text-primary",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-primary/10"
              >
                Log in
              </Link>
              <div className="hidden h-10 w-[132px] sm:block">
                <GlassyButton label="Sign up" link="/signup" />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
