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
      {!isHome && <MarketingNav />}
      <main className={cn("flex-1", !isHome && "pt-20")}>{children}</main>
      <SiteFooter />
    </>
  );
}
