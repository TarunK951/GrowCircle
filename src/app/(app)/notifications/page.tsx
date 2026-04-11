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
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      <ul className="mt-8 space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border border-primary/10 px-4 py-3 ${
              n.read ? "bg-white/40" : "bg-primary/5"
            }`}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => markRead(n.id)}
            >
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 text-sm text-muted">{n.body}</p>
              <p className="mt-2 text-xs text-muted">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
