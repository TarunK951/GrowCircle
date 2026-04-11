"use client";

import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import eventsData from "@/data/events.json";
import type { MeetEvent } from "@/lib/types";

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const bookings = useSessionStore((s) => s.bookings);
  const hostDraft = useSessionStore((s) => s.hostDraft);
  const events = eventsData as MeetEvent[];

  const upcoming = bookings
    .map((b) => events.find((e) => e.id === b.eventId))
    .filter(Boolean) as MeetEvent[];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Hello, {user?.name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-2 text-muted">
        Your mock dashboard — bookings and host drafts update instantly.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-primary/10 bg-white/50 p-5">
          <h2 className="font-semibold">Upcoming meets</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No bookings yet —{" "}
              <Link className="text-primary" href="/discover">
                discover meets
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="text-primary">
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-primary/10 bg-white/50 p-5">
          <h2 className="font-semibold">Host draft</h2>
          {hostDraft?.title ? (
            <p className="mt-3 text-sm text-muted">
              <span className="font-medium text-foreground">{hostDraft.title}</span>{" "}
              — {hostDraft.cityId} · {hostDraft.category}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Nothing yet —{" "}
              <Link href="/host-a-meet" className="text-primary">
                host a meet
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
