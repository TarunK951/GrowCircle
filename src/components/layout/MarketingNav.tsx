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
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  aliases?: string[];
};

/** Same primary nav everywhere — matches landing hero bar (Discover / Host). */
const navLinks: NavLink[] = [
  { href: "/join", label: "Discover events", aliases: ["/join-a-meet", "/explore"] },
  { href: "/host", label: "Host event", aliases: ["/host-a-meet"] },
];

function navActive(pathname: string, href: string, aliases?: string[]) {
  if (pathname === href) return true;
  return aliases?.some((a) => pathname === a) ?? false;
}

const btnPrimary =
  "!border-0 !bg-primary !text-white !shadow-md !shadow-primary/25 hover:!-translate-y-0.5 hover:!bg-primary/92 active:!scale-[0.98]";

const glassHome = "nav-liquid-glass-hero";

/** Home: compact black pill — same footprint as Get Started (body only; no knob). */
const homeNavCtaBase =
  "!inline-flex !h-8 !min-h-0 !shrink-0 !items-center !justify-center !rounded-full !border !border-black/55 !bg-black !px-3.5 !py-1 !text-[11px] !font-medium !leading-none !tracking-[0.01em] !text-white !shadow-none hover:!-translate-y-0.5 active:!scale-[0.98] sm:!h-9 sm:!px-4 sm:!text-xs";

const switchCta = cn(
  homeNavCtaBase,
  "after:ml-1.5 after:inline-flex after:size-4 after:shrink-0 after:items-center after:justify-center after:rounded-full after:bg-white after:align-middle after:content-[''] sm:after:ml-2",
);

export function MarketingNav() {
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = navLinks.map((l) => {
    const link =
      isAuthenticated && l.href === "/join" ? "/explore" : l.href;
    const active =
      navActive(pathname, l.href, l.aliases) ||
      (l.href === "/join" && isAuthenticated && pathname === "/explore");
    return { name: l.label, link, active };
  });

  return (
    <div className="relative w-full">
      <Navbar
        disableFloating
        className="top-2 px-2 sm:top-3 sm:px-3"
      >
        <NavBody
          className={cn(
            glassHome,
            "min-h-10 rounded-full gap-1.5 py-1 pl-2 pr-1 sm:gap-2 sm:pl-3 sm:pr-1.5 sm:py-1.5 md:pl-4 md:pr-2",
          )}
        >
          <NavbarLogo
            wordmarkClassName="h-7 w-auto max-w-[min(220px,54vw)] sm:h-8 md:h-9"
          />
          <NavItems
            items={navItems}
            onItemClick={() => setIsMobileMenuOpen(false)}
            className="gap-0 sm:gap-0.5 [&_a]:text-[11px] [&_a]:font-medium [&_a]:text-black/80 [&_a]:px-2 [&_a]:py-1 sm:[&_a]:px-2.5 sm:[&_a]:py-1.5 sm:[&_a]:text-xs"
          />
          <div className="relative z-[70] flex shrink-0 items-center gap-3">
            {isAuthenticated ? (
              <NavbarButton
                as={Link}
                href="/profile"
                variant="dark"
                className={homeNavCtaBase}
              >
                Profile
              </NavbarButton>
            ) : (
              <NavbarButton
                as={Link}
                href="/signup"
                variant="primary"
                className={switchCta}
              >
                Get Started
              </NavbarButton>
            )}
          </div>
        </NavBody>

        <MobileNav
          className={cn(
            glassHome,
            "rounded-full py-1 pl-2 pr-1 sm:pl-3 sm:pr-1.5 md:pl-4 md:pr-2",
          )}
        >
          <MobileNavHeader>
            <NavbarLogo
              wordmarkClassName="h-7 w-auto max-w-[min(220px,58vw)] sm:h-8"
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
