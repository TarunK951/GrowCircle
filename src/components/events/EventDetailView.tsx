"use client";

import { notFound } from "next/navigation";
import { EventMeetDetail } from "@/components/events/EventMeetDetail";
import { useResolvedEvent } from "@/hooks/useResolvedEvent";
import { resolveEventDetail } from "@/lib/eventDetail";
import { hostLabelForEvent } from "@/lib/hostName";
import { useSessionStore } from "@/stores/session-store";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

function seatCountForEvent(
  eventId: string,
  bookings: { eventId: string; status: string }[],
): number {
  return bookings.filter(
    (b) =>
      b.eventId === eventId &&
      (b.status === "confirmed" || b.status === "attended"),
  ).length;
}

export function EventDetailView({ id }: { id: string }) {
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const bookings = useSessionStore((s) => s.bookings);
  const user = useSessionStore((s) => s.user);

  const { event, loading } = useResolvedEvent(id);

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white/80 p-10 text-center text-sm text-neutral-600">
        Loading event…
      </div>
    );
  }

  if (!event) notFound();

  const isUserHosted = hostedEvents.some((e) => e.id === event.id);
  const overrideSpotsTaken = isUserHosted
    ? Math.min(event.capacity, seatCountForEvent(event.id, bookings))
    : undefined;

  const detail = resolveEventDetail(
    event,
    overrideSpotsTaken !== undefined
      ? { overrideSpotsTaken }
      : undefined,
  );

  const cities = citiesData as City[];
  const city = cities.find((c) => c.id === event.cityId);
  const hostName = hostLabelForEvent(event, user ?? null);

  const price =
    event.priceCents === 0
      ? "Free"
      : `$${(event.priceCents / 100).toFixed(2)}`;

  const whenLabel = new Date(event.startsAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <EventMeetDetail
      event={event}
      detail={detail}
      cityName={event.displayLocation ?? city?.name ?? ""}
      hostName={hostName}
      priceLabel={price}
      whenLabel={whenLabel}
    />
  );
}
