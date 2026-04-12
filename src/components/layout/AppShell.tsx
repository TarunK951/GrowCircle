"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutApi } from "@/lib/circle/api";
import { isCircleApiConfigured } from "@/lib/circle/config";
import {
  selectAccessToken,
  selectRefreshToken,
  selectUser,
} from "@/lib/store/authSlice";
import { useUnreadNotificationCountQuery } from "@/lib/store/circleApi";
import { useAppSelector } from "@/lib/store/hooks";
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
  Star,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";

const SIDEBAR_COLLAPSED_KEY = "gc-app-sidebar-collapsed";

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
  { href: "/reviews", label: "Reviews", icon: Star },
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
  const user = useAppSelector(selectUser);
  const logout = useSessionStore((s) => s.logout);
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const { data: unreadNotifCount = 0, refetch: refetchUnread } =
    useUnreadNotificationCountQuery(undefined, {
      skip: !accessToken || !isCircleApiConfigured(),
    });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  useEffect(() => {
    const onRefresh = () => {
      void refetchUnread();
    };
    window.addEventListener("circle-unread-refresh", onRefresh);
    return () => window.removeEventListener("circle-unread-refresh", onRefresh);
  }, [refetchUnread]);

  return (
    <div className="flex min-h-0 flex-1">
      <aside
        className={cn(
          "hidden shrink-0 border-r border-neutral-200 bg-white transition-[width] duration-200 ease-out md:block",
          collapsed ? "md:w-16" : "md:w-60 lg:w-64",
        )}
      >
        <div className="sticky top-20 flex max-h-[calc(100vh-5rem)] flex-col gap-2 p-3 lg:p-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                "flex h-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-sm transition hover:bg-neutral-50",
                collapsed ? "w-full" : "w-9",
              )}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand menu" : "Collapse menu"}
              title={collapsed ? "Expand menu" : "Collapse menu"}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronsLeft className="h-4 w-4" aria-hidden />
              )}
            </button>
            {!collapsed && (
              <p className="min-w-0 flex-1 truncate px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-900">
                Menu
              </p>
            )}
          </div>

          <nav
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
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
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition",
                      collapsed ? "justify-center px-2" : "px-3",
                      active
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "text-neutral-900 hover:bg-neutral-100",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" />
                    {!collapsed && (
                      <span className="min-w-0 flex-1">{item.label}</span>
                    )}
                    {!collapsed &&
                      item.href === "/notifications" &&
                      unreadNotifCount > 0 && (
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
                    {collapsed &&
                      item.href === "/notifications" &&
                      unreadNotifCount > 0 && (
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-600" />
                      )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div
            className={cn(
              "relative isolate mt-1 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-linear-to-br from-neutral-50 to-white shadow-sm",
              collapsed ? "p-2" : "p-4",
            )}
          >
            <div
              className={cn(
                "flex gap-3",
                collapsed ? "flex-col items-center" : "flex-row",
              )}
            >
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
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {user?.name ?? "Guest"}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-neutral-900">
                    {user?.email ?? "—"}
                  </p>
                </div>
              )}
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
              title="Log out"
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50",
                collapsed ? "px-2 py-2" : "px-3 py-2.5",
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed && "Log out"}
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-8 text-neutral-900 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
