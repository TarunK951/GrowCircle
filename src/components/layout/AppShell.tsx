"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutApi } from "@/lib/circle/api";
import { getUnreadNotificationCount } from "@/lib/circle/notificationsApi";
import { isCircleApiConfigured } from "@/lib/circle/config";
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
  Share2,
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
  { href: "/social", label: "Social", icon: Share2 },
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
  const accessToken = useSessionStore((s) => s.accessToken);
  const refreshToken = useSessionStore((s) => s.refreshToken);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    const load = () => {
      if (!accessToken || !isCircleApiConfigured()) {
        setUnreadNotifCount(0);
        return;
      }
      void getUnreadNotificationCount(accessToken)
        .then((d) => setUnreadNotifCount(d.count))
        .catch(() => setUnreadNotifCount(0));
    };
    load();
    const onRefresh = () => load();
    window.addEventListener("circle-unread-refresh", onRefresh);
    return () => window.removeEventListener("circle-unread-refresh", onRefresh);
  }, [pathname, accessToken]);

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white md:block lg:w-64">
        <div className="sticky top-20 flex h-[calc(100vh-5rem)] flex-col p-4 lg:p-5">
          <p className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-900">
            Menu
          </p>
          <nav
            className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
            aria-label="App navigation"
          >
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-none">
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
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {item.href === "/notifications" && unreadNotifCount > 0 && (
                      <span
                        className={cn(
                          "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                          active
                            ? "bg-white text-neutral-900"
                            : "bg-red-600 text-white",
                        )}
                        aria-label={`${unreadNotifCount} unread`}
                      >
                        {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="relative isolate mt-4 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-linear-to-br from-neutral-50 to-white p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-900">
                    {(user?.name ?? "G").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {user?.name ?? "Guest"}
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-neutral-900">
                  {user?.email ?? "—"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  if (
                    accessToken &&
                    refreshToken &&
                    isCircleApiConfigured()
                  ) {
                    try {
                      await logoutApi(accessToken, refreshToken);
                    } catch {
                      /* still sign out locally */
                    }
                  }
                  logout();
                })();
              }}
              className="mt-3 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
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
