"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSessionStore } from "@/stores/session-store";
import { mergeEventCatalog } from "@/lib/eventsCatalog";
import { hostNameForUserId } from "@/lib/hostName";
import type { Booking } from "@/lib/types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80";

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

type ActivityRow = {
  id: string;
  line: string;
  at: string;
  eventId: string;
  badge: string;
};

function HistoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
      {label}
    </span>
  );
}

export default function HistoryPage() {
  const user = useSessionStore((s) => s.user);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents, circleCatalogEvents),
    [hostedEvents, circleCatalogEvents],
  );

  const activity = useMemo(() => {
    if (!user) return [];
    const rows: ActivityRow[] = [];

    for (const b of bookings) {
      if (b.userId !== user.id) continue;
      const ev = catalog.find((e) => e.id === b.eventId);
      const title = ev?.title ?? "Event";
      const badge =
        b.status === "confirmed"
          ? "Confirmed"
          : b.status === "pending"
            ? "Applied"
            : b.status === "attended"
              ? "Attended"
              : b.status === "cancelled"
                ? "Cancelled"
                : "Update";
      rows.push({
        id: `g-${b.id}`,
        line: bookingActivityLine(b, title),
        at: b.createdAt,
        eventId: b.eventId,
        badge,
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
        eventId: ev.id,
        badge: b.status === "pending" ? "Request" : "Guest",
      });
    }

    rows.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    return rows;
  }, [bookings, catalog, user]);

  return (
    <div className="mx-auto max-w-3xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-8">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          History
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
          A chronological log of booking activity on this device (demo). This is
          separate from{" "}
          <Link
            href="/bookings"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Bookings
          </Link>
          , where you manage trips and hosting.
        </p>
      </div>

      <ul className="mt-8 flex flex-col gap-4">
        {activity.length === 0 && (
          <li className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm font-medium text-neutral-900">
            No history yet — join a meet or host one to see entries here.
          </li>
        )}
        {activity.map((row) => {
          const ev = catalog.find((e) => e.id === row.eventId);
          const img = ev?.image ?? FALLBACK_IMAGE;
          return (
            <li
              key={row.id}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-stretch">
                <Link
                  href={`/event/${row.eventId}`}
                  className="relative block h-44 w-full shrink-0 bg-neutral-100 sm:h-auto sm:w-40 md:w-44"
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="(max-width:640px) 100vw, 176px"
                    className="object-cover"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <HistoryBadge label={row.badge} />
                  </div>
                  <p className="text-base font-semibold leading-snug text-neutral-900">
                    {row.line}
                  </p>
                  <p className="text-sm font-medium text-neutral-900">
                    {new Date(row.at).toLocaleString()}
                  </p>
                  {ev && (
                    <p className="text-xs font-medium text-neutral-800">
                      {ev.venueName ? `${ev.venueName} · ` : ""}
                      {hostNameForUserId(ev.hostUserId) ?? "Host"}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
