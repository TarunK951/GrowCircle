"use client";

import { useMemo } from "react";
import { useSessionStore } from "@/stores/session-store";
import seed from "@/data/notifications.seed.json";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPage() {
  const markRead = useSessionStore((s) => s.markNotificationRead);
  const readMap = useSessionStore((s) => s.notificationsRead);

  const items = useMemo(() => {
    const base = seed as NotificationItem[];
    return base.map((n) => ({
      ...n,
      read: readMap[n.id] ?? n.read,
    }));
  }, [readMap]);

  return (
    <div className="mx-auto max-w-2xl text-neutral-900">
      <h1 className="font-onest text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        Notifications
      </h1>
      <p className="mt-2 text-sm font-medium text-neutral-900">
        Updates about meets you follow — tap a row to mark read (demo).
      </p>
      <ul className="mt-8 space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border border-neutral-200 px-4 py-3 transition ${
              n.read ? "bg-white" : "bg-neutral-50"
            }`}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => markRead(n.id)}
            >
              <p className="font-semibold text-neutral-900">{n.title}</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-900">
                {n.body}
              </p>
              <p className="mt-2 text-xs font-medium text-neutral-800">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
