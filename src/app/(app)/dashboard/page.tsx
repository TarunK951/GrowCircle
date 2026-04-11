"use client";

import Link from "next/link";
import { useMemo } from "react";
import { mergeEventCatalog } from "@/lib/eventsCatalog";
import { useSessionStore } from "@/stores/session-store";
import type { MeetEvent } from "@/lib/types";

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents),
    [hostedEvents],
  );

  const upcoming = useMemo(() => {
    if (!user) return [];
    const seen = new Set<string>();
    const out: MeetEvent[] = [];
    for (const b of bookings) {
      if (b.userId !== user.id) continue;
      if (
        b.status !== "confirmed" &&
        b.status !== "pending" &&
        b.status !== "attended"
      ) {
        continue;
      }
      if (seen.has(b.eventId)) continue;
      const e = catalog.find((x) => x.id === b.eventId);
      if (e) {
        seen.add(e.id);
        out.push(e);
      }
    }
    return out;
  }, [bookings, catalog, user]);

  const hostingPreview = useMemo(() => {
    if (!user) return [];
    return catalog.filter((e) => e.hostUserId === user.id).slice(0, 3);
  }, [catalog, user]);

  return (
    <div>
      <h1 className="font-onest text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Hello, {user?.name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-2 text-muted">
        Your mock dashboard — bookings and hosting update from browser state.
      </p>
      <p className="mt-2 text-sm">
        <Link className="font-medium text-primary hover:underline" href="/bookings">
          Open Bookings
        </Link>{" "}
        for guest lists, share links, and check-in.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="liquid-glass-surface liquid-glass-interactive">
          <h2 className="text-base font-semibold text-foreground">
            Upcoming bookings
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
          <h2 className="text-base font-semibold text-foreground">Hosting</h2>
          {hostingPreview.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Nothing listed —{" "}
              <Link href="/host" className="font-medium text-primary hover:underline">
                host a meet
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {hostingPreview.map((e) => (
                <li key={e.id}>
                  <Link
                    href="/bookings"
                    className="font-medium text-primary hover:underline"
                  >
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
