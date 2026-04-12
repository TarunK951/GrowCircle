"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMyApplications } from "@/lib/circle/api";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type { CircleMyApplication } from "@/lib/circle/types";
import { mergeEventCatalog } from "@/lib/eventsCatalog";
import { cn } from "@/lib/utils";
import { selectAccessToken, selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import type { MeetEvent } from "@/lib/types";

type DashboardTab = "bookings" | "hosting";

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
  const [tab, setTab] = useState<DashboardTab>("bookings");
  const user = useAppSelector(selectUser);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const accessToken = useAppSelector(selectAccessToken);

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
      <h1 className="font-onest text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        Hello, {user?.name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-2 text-neutral-900">
        {backendConnected
          ? "Your dashboard — bookings and hosting sync with the Circle API when you sign in with your phone."
          : "Your local dashboard — bookings and hosting update in the browser."}
      </p>
      <p className="mt-2 text-sm text-neutral-900">
        <Link className="font-medium text-primary hover:underline" href="/bookings">
          Open Bookings
        </Link>{" "}
        for applications, tickets, and host tools.
      </p>

      <div className="mt-8">
        <div
          className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1"
          role="tablist"
          aria-label="Dashboard sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "bookings"}
            id="dashboard-tab-bookings"
            onClick={() => setTab("bookings")}
            className={cn(
              "min-h-10 rounded-lg px-3 py-2 text-center text-sm font-semibold transition",
              tab === "bookings"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            Upcoming bookings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "hosting"}
            id="dashboard-tab-hosting"
            onClick={() => setTab("hosting")}
            className={cn(
              "min-h-10 rounded-lg px-3 py-2 text-center text-sm font-semibold transition",
              tab === "hosting"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            Hosting
          </button>
        </div>

        <div
          className="liquid-glass-surface liquid-glass-interactive mt-4"
          role="tabpanel"
          aria-labelledby={
            tab === "bookings" ? "dashboard-tab-bookings" : "dashboard-tab-hosting"
          }
        >
          {tab === "bookings" ? (
            <>
              <h2 className="text-base font-semibold text-neutral-900">
                Upcoming bookings
              </h2>
              {circleListLoading ? (
                <p className="mt-3 text-sm text-neutral-900">
                  Loading your applications…
                </p>
              ) : useBackendBookings ? (
                circleUpcoming.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-900">
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
                            <span className="font-medium text-neutral-900">
                              {title}
                            </span>
                          )}
                          <span className="text-xs text-neutral-900">
                            {humanizeStatus(a.status)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-900">
                  No bookings yet —{" "}
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
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-neutral-900">Hosting</h2>
              {hostingPreview.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-900">
                  Nothing listed —{" "}
                  <Link
                    href="/host"
                    className="font-medium text-primary hover:underline"
                  >
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
