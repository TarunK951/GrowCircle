import Link from "next/link";
import {
  LayoutDashboard,
  Compass,
  Calendar,
  History as HistoryIcon,
  Bookmark,
  MessageCircle,
  Bell,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ProfileAccountLinks() {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 sm:p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-900">
        Account
      </h2>
      <p className="mt-1 text-sm font-medium text-neutral-800">
        Jump to a section of the app.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-50"
            >
              <Icon className="h-4 w-4 shrink-0 text-neutral-700" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
