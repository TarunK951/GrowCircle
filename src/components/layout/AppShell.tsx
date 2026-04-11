"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import {
  LayoutDashboard,
  User,
  ShieldCheck,
  Calendar,
  Bookmark,
  MessageCircle,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

type ShellNav = {
  href: string;
  label: string;
  icon: LucideIcon;
  aliases?: string[];
};

const nav: ShellNav[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/verify-profile", label: "Verify", icon: ShieldCheck },
  {
    href: "/my-events",
    label: "My meets",
    icon: Calendar,
    aliases: ["/bookings"],
  },
  { href: "/saved", label: "Saved", icon: Bookmark },
  {
    href: "/chat",
    label: "Messages",
    icon: MessageCircle,
    aliases: ["/messages"],
  },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

function shellNavActive(pathname: string, href: string, aliases?: string[]) {
  if (pathname === href) return true;
  return aliases?.some((a) => pathname === a) ?? false;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);

  return (
    <div className="flex min-h-[calc(100vh-0px)]">
      <aside className="hidden w-56 shrink-0 border-r border-primary/10 bg-canvas/80 p-4 backdrop-blur-xl md:block">
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Account
        </p>
        <nav className="mt-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = shellNavActive(
              pathname,
              item.href,
              item.aliases,
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-primary/5",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 rounded-xl border border-primary/10 bg-white/40 p-3 text-xs text-muted">
          <p className="font-medium text-foreground">{user?.name ?? "Guest"}</p>
          <p className="truncate">{user?.email}</p>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-2 text-primary underline-offset-4 hover:underline"
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
