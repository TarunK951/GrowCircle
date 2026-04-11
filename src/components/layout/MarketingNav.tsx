"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { PrimaryButton } from "@/components/ui/MarketingButton";

type NavLink = {
  href: string;
  label: string;
  aliases?: string[];
};

const links: NavLink[] = [
  { href: "/explore", label: "Explore", aliases: ["/discover"] },
  { href: "/locations", label: "Locations" },
  { href: "/host", label: "Host", aliases: ["/host-a-meet"] },
  { href: "/join", label: "Join", aliases: ["/join-a-meet"] },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/careers", label: "Careers" },
];

function navActive(pathname: string, href: string, aliases?: string[]) {
  if (pathname === href) return true;
  return aliases?.some((a) => pathname === a) ?? false;
}

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
                navActive(pathname, l.href, l.aliases) &&
                  "bg-primary/10 text-primary",
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
              <Link
                href="/signup"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92 sm:hidden"
              >
                Sign up
              </Link>
              <div className="hidden min-h-10 sm:block">
                <PrimaryButton href="/signup" label="Sign up" className="!min-h-10 !min-w-[7.5rem] !px-5 !text-sm" />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
