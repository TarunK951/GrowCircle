"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMyApplications } from "@/lib/circle/api";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type { CircleMyApplication } from "@/lib/circle/types";
import { mergeEventCatalog } from "@/lib/eventsCatalog";
import { useSessionStore } from "@/stores/session-store";
import type { MeetEvent } from "@/lib/types";

const CIRCLE_ACTIVE = new Set([
  "pending",
  "pending_payment",
  "paid",
  "selected",
  "confirmed",
  "waitlisted",
  "attended",
  "checked_in",
]);

function humanizeStatus(s: string) {
  const x = s.replace(/_/g, " ");
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export default function DashboardPage() {
  const user = useSessionStore((s) => s.user);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const accessToken = useSessionStore((s) => s.accessToken);

  const [circleApps, setCircleApps] = useState<CircleMyApplication[] | null>(
    null,
  );

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken) {
      setCircleApps(null);
      return;
    }
    let cancelled = false;
    void getMyApplications(accessToken)
      .then((rows) => {
        if (!cancelled) setCircleApps(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setCircleApps([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents, circleCatalogEvents),
    [hostedEvents, circleCatalogEvents],
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

  const circleUpcoming = useMemo(() => {
    if (!circleApps?.length) return [];
    return circleApps.filter((a) => CIRCLE_ACTIVE.has(a.status));
  }, [circleApps]);

  const hostingPreview = useMemo(() => {
    if (!user) return [];
    return catalog.filter((e) => e.hostUserId === user.id).slice(0, 3);
  }, [catalog, user]);

  const useBackendBookings =
    isCircleApiConfigured() && Boolean(accessToken) && circleApps !== null;
  const circleListLoading =
    isCircleApiConfigured() && Boolean(accessToken) && circleApps === null;

  const backendConnected = isCircleApiConfigured();

  return (
    <div>
      <h1 className="font-onest text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Hello, {user?.name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-2 text-muted">
        {backendConnected
          ? "Your dashboard — bookings and hosting sync with the Circle API when you sign in with your phone."
          : "Your local dashboard — bookings and hosting update in the browser."}
      </p>
      <p className="mt-2 text-sm">
        <Link className="font-medium text-primary hover:underline" href="/bookings">
          Open Bookings
        </Link>{" "}
        for applications, tickets, and host tools.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="liquid-glass-surface liquid-glass-interactive">
          <h2 className="text-base font-semibold text-foreground">
            Upcoming bookings
          </h2>
          {circleListLoading ? (
            <p className="mt-3 text-sm text-muted">Loading your applications…</p>
          ) : useBackendBookings ? (
            circleUpcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No active applications —{" "}
                <Link
                  className="font-medium text-primary hover:underline"
                  href="/explore"
                >
                  explore meets
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {circleUpcoming.map((a) => {
                  const eventId = a.event?.id;
                  const title = a.event?.title ?? "Event";
                  return (
                    <li
                      key={a.id}
                      className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      {eventId ? (
                        <Link
                          href={`/event/${eventId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {title}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{title}</span>
                      )}
                      <span className="text-xs text-muted">
                        {humanizeStatus(a.status)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )
          ) : upcoming.length === 0 ? (
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
