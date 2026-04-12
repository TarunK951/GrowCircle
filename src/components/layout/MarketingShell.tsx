"use client";

import { usePathname } from "next/navigation";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { cn } from "@/lib/utils";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <MarketingNav />
      {/* Home: no top padding — hero is full-bleed under the fixed nav (no white strip). */}
      <main className={cn("flex-1", isHome ? "pt-0" : "pt-20")}>{children}</main>
      <SiteFooter />
    </>
  );
}
