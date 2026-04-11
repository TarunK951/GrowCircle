"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSessionStore } from "@/stores/session-store";
import { mergeEventCatalog } from "@/lib/eventsCatalog";
import type { Booking } from "@/lib/types";

function bookingActivityLine(b: Booking, eventTitle: string): string {
  switch (b.status) {
    case "confirmed":
      return `Booking confirmed — ${eventTitle}`;
    case "pending":
      return `Request sent — ${eventTitle}`;
    case "attended":
      return `Attended — ${eventTitle}`;
    case "cancelled":
      return `Booking cancelled — ${eventTitle}`;
    default:
      return `Update — ${eventTitle}`;
  }
}

export default function HistoryPage() {
  const user = useSessionStore((s) => s.user);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents),
    [hostedEvents],
  );

  const activity = useMemo(() => {
    if (!user) return [];
    const rows: { id: string; line: string; at: string }[] = [];

    for (const b of bookings) {
      if (b.userId !== user.id) continue;
      const ev = catalog.find((e) => e.id === b.eventId);
      const title = ev?.title ?? "Event";
      rows.push({
        id: `g-${b.id}`,
        line: bookingActivityLine(b, title),
        at: b.createdAt,
      });
    }

    for (const b of bookings) {
      const ev = catalog.find((e) => e.id === b.eventId);
      if (!ev || ev.hostUserId !== user.id) continue;
      if (b.userId === user.id) continue;
      rows.push({
        id: `h-${b.id}`,
        line: `Guest ${b.status === "pending" ? "request" : "update"} — ${ev.title}`,
        at: b.createdAt,
      });
    }

    rows.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    return rows;
  }, [bookings, catalog, user]);

  return (
    <div className="mx-auto max-w-2xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-8">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          History
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-800">
          A chronological log of booking activity on this device (demo). This is
          separate from{" "}
          <Link href="/bookings" className="font-semibold text-primary underline-offset-4 hover:underline">
            Bookings
          </Link>
          , where you manage trips and hosting.
        </p>
      </div>

      <ul className="mt-8 space-y-3">
        {activity.length === 0 && (
          <li className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm font-medium text-neutral-800">
            No history yet — join a meet or host one to see entries here.
          </li>
        )}
        {activity.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium shadow-sm"
          >
            <p className="text-neutral-900">{row.line}</p>
            <p className="mt-1 text-xs font-medium text-neutral-700">
              {new Date(row.at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
