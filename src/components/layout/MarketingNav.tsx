"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  aliases?: string[];
};

const links: NavLink[] = [
  { href: "/host", label: "Host", aliases: ["/host-a-meet"] },
  { href: "/join", label: "Join", aliases: ["/join-a-meet"] },
  { href: "/bookings", label: "Bookings", aliases: ["/my-events"] },
];

function navActive(pathname: string, href: string, aliases?: string[]) {
  if (pathname === href) return true;
  return aliases?.some((a) => pathname === a) ?? false;
}

const btnPrimary =
  "!border-0 !bg-primary !text-white !shadow-md !shadow-primary/25 hover:!-translate-y-0.5 hover:!bg-primary/92 active:!scale-[0.98]";

/** Tighter pill for desktop + mobile marketing CTAs */
const btnPrimaryCompact = cn(
  btnPrimary,
  "!px-3 !py-1.5 !text-xs !font-semibold hover:!-translate-y-0.5 sm:!px-3.5 sm:!py-2 sm:!text-sm",
);

const glassHome = "nav-liquid-glass-hero";

export function MarketingNav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = links.map((l) => ({
    name: l.label,
    link: l.href,
    active: navActive(pathname, l.href, l.aliases),
  }));

  return (
    <div className="relative w-full">
      {/* Full-width bar on every route — never collapse into the floating pill on scroll */}
      <Navbar disableFloating>
        <NavBody
          className={cn(
            isHome && glassHome,
            isHome &&
              "min-h-12 gap-2 py-1 sm:gap-3 sm:px-5 sm:py-1.5 md:px-6 md:py-2",
          )}
        >
          <NavbarLogo
            wordmarkClassName="h-10 w-auto max-w-[min(280px,58vw)] sm:h-11 md:h-12"
          />
          <NavItems
            items={navItems}
            onItemClick={() => setIsMobileMenuOpen(false)}
            className={
              isHome
                ? "gap-0 sm:gap-1 [&_a]:px-2 [&_a]:py-1.5 sm:[&_a]:px-3 sm:[&_a]:py-2"
                : undefined
            }
          />
          <div className="relative z-[70] flex shrink-0 items-center gap-3">
            {isAuthenticated ? (
              <NavbarButton
                as={Link}
                href="/profile"
                variant="primary"
                className={btnPrimaryCompact}
              >
                Profile
              </NavbarButton>
            ) : (
              <NavbarButton
                as={Link}
                href="/signup"
                variant="primary"
                className={btnPrimaryCompact}
              >
                Get Started
              </NavbarButton>
            )}
          </div>
        </NavBody>

        <MobileNav
          className={cn(
            isHome && glassHome,
            isHome && "py-1 sm:px-5 md:px-6",
          )}
        >
          <MobileNavHeader>
            <NavbarLogo
              wordmarkClassName="h-10 w-auto max-w-[min(280px,58vw)] sm:h-11"
            />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((o) => !o)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "relative block w-full text-neutral-600 dark:text-neutral-300",
                  item.active && "font-medium text-primary",
                )}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex w-full flex-col gap-3 pt-2">
              {isAuthenticated ? (
                <NavbarButton
                  as={Link}
                  href="/profile"
                  variant="primary"
                  className={cn(btnPrimary, "w-full !py-2.5 !text-sm")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </NavbarButton>
              ) : (
                <NavbarButton
                  as={Link}
                  href="/signup"
                  variant="primary"
                  className={cn(btnPrimary, "w-full !py-2.5 !text-sm")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </NavbarButton>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
