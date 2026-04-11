"use client";

import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import eventsData from "@/data/events.json";
import type { MeetEvent } from "@/lib/types";

export default function BookingsPage() {
  const bookings = useSessionStore((s) => s.bookings);
  const events = eventsData as MeetEvent[];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My meets</h1>
      <p className="mt-2 text-muted">Mock bookings from the join flow.</p>
      <ul className="mt-8 space-y-3">
        {bookings.length === 0 && (
          <li className="text-sm text-muted">No bookings yet.</li>
        )}
        {bookings.map((b) => {
          const e = events.find((x) => x.id === b.eventId);
          if (!e) return null;
          return (
            <li
              key={b.id}
              className="rounded-xl border border-primary/10 bg-white/50 px-4 py-3"
            >
              <Link href={`/events/${e.id}`} className="font-medium text-primary">
                {e.title}
              </Link>
              <p className="text-xs text-muted">
                {b.status} · {new Date(b.createdAt).toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
