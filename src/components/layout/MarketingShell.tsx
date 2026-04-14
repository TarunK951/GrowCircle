"use client";

import { usePathname } from "next/navigation";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { cn } from "@/lib/utils";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  /** Host wizard: slimmer offset under fixed nav — page uses tighter `page-shell` too. */
  const isHostWizard =
    pathname === "/host-a-meet" || pathname === "/host";
  const isDiscoverExplore =
    pathname === "/discover" || pathname === "/explore";

  return (
    <>
      <MarketingNav />
      {/* Home: no top padding — hero is full-bleed under the fixed nav (no white strip). */}
      <main
        className={cn(
          "flex-1",
          isHome
            ? "pt-0"
            : isHostWizard
              ? "pt-16"
              : isDiscoverExplore
                ? "pt-10"
                : "pt-20",
        )}
      >
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
