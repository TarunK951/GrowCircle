"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import {
  LayoutDashboard,
  User,
  ShieldCheck,
  History,
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
  { href: "/history", label: "History", icon: History },
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
    <div className="flex min-h-[calc(100vh-4.25rem)]">
      <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white md:block lg:w-64">
        <div className="sticky top-[4.25rem] flex h-[calc(100vh-4.25rem)] flex-col p-4 lg:p-5">
          <p className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-900">
            Menu
          </p>
          <nav className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto">
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
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-900 hover:bg-neutral-100",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="relative isolate mt-auto overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-neutral-900">
            <p className="text-sm font-semibold text-neutral-900">
              {user?.name ?? "Guest"}
            </p>
            <p className="mt-1 truncate text-xs font-medium text-neutral-900">
              {user?.email}
            </p>
            <button
              type="button"
              onClick={() => logout()}
              className="mt-3 text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-white px-4 py-8 text-neutral-900 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
