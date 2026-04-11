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
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Hello, {user?.name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-2 text-muted">
        Your mock dashboard — bookings and host drafts update instantly.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="liquid-glass-surface liquid-glass-interactive">
          <h2 className="text-base font-semibold text-foreground">
            Upcoming meets
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No bookings yet —{" "}
              <Link className="font-medium text-primary hover:underline" href="/explore">
                explore meets
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/event/${e.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="liquid-glass-surface liquid-glass-interactive">
          <h2 className="text-base font-semibold text-foreground">Host draft</h2>
          {hostDraft?.title ? (
            <p className="mt-3 text-sm text-muted">
              <span className="font-medium text-foreground">{hostDraft.title}</span>{" "}
              — {hostDraft.cityId} · {hostDraft.category}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Nothing yet —{" "}
              <Link href="/host" className="font-medium text-primary hover:underline">
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
