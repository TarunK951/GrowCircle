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
  { href: "/careers", label: "Careers" },
];

function navActive(pathname: string, href: string, aliases?: string[]) {
  if (pathname === href) return true;
  return aliases?.some((a) => pathname === a) ?? false;
}

const btnPrimary =
  "!border-0 !bg-primary !text-white !shadow-md !shadow-primary/25 hover:!-translate-y-0.5 hover:!bg-primary/92 active:!scale-[0.98]";

export function MarketingNav() {
  const pathname = usePathname();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = links.map((l) => ({
    name: l.label,
    link: l.href,
    active: navActive(pathname, l.href, l.aliases),
  }));

  return (
    <div className="relative w-full">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems
            items={navItems}
            onItemClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-[70] flex shrink-0 items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <NavbarButton
                as={Link}
                href="/dashboard"
                variant="primary"
                className={cn(btnPrimary, "!px-4 !py-2 !text-sm")}
              >
                Dashboard
              </NavbarButton>
            ) : (
              <NavbarButton
                as={Link}
                href="/signup"
                variant="primary"
                className={cn(btnPrimary, "!px-4 !py-2 !text-sm")}
              >
                Sign up
              </NavbarButton>
            )}
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
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
                  href="/dashboard"
                  variant="primary"
                  className={cn(btnPrimary, "w-full !py-3")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </NavbarButton>
              ) : (
                <NavbarButton
                  as={Link}
                  href="/signup"
                  variant="primary"
                  className={cn(btnPrimary, "w-full !py-3")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign up
                </NavbarButton>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
