"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems: { href: string; label: string }[] = [
  { href: "/profile", label: "Profile" },
  { href: "/dashboard", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/history", label: "History" },
  { href: "/chat", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/saved", label: "Saved" },
  { href: "/settings", label: "Settings" },
];

function itemActive(pathname: string, href: string) {
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
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeaderProfileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative ml-auto flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50",
          open && "border-neutral-900 bg-neutral-50",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Profile
        <ChevronDown
          className={cn("h-4 w-4 transition", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[14rem] rounded-xl border border-neutral-200 bg-white py-2 shadow-lg"
          role="menu"
        >
          {menuItems.map((item) => {
            const active = itemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={cn(
                  "block px-4 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-900 hover:bg-neutral-100",
                )}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
