"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explore", label: "Explore" },
  { href: "/history", label: "History" },
  { href: "/chat", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
];

function navActive(pathname: string, href: string) {
  if (href === "/explore") {
    return pathname === "/explore" || pathname === "/discover";
  }
  if (href === "/history") {
    return (
      pathname === "/history" ||
      pathname === "/bookings" ||
      pathname === "/my-events"
    );
  }
  if (href === "/chat") {
    return pathname === "/chat" || pathname === "/messages";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppHeaderNav() {
  const pathname = usePathname();

  return (
    <nav
      className="scrollbar-none flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-0.5 overflow-x-auto py-1 sm:justify-center sm:gap-1"
      aria-label="App"
    >
      {items.map((item) => {
        const active = navActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm",
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-900 hover:bg-neutral-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
