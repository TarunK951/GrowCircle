"use client";

import { notFound } from "next/navigation";
import { EventMeetDetail } from "@/components/events/EventMeetDetail";
import { getEventFromCatalog } from "@/lib/eventsCatalog";
import { resolveEventDetail } from "@/lib/eventDetail";
import { hostNameForUserId } from "@/lib/hostName";
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

  const event = getEventFromCatalog(id, hostedEvents);
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
  const hostName =
    event.hostUserId === user?.id
      ? user.name
      : hostNameForUserId(event.hostUserId) ?? "Host";

  const price =
    event.priceCents === 0
      ? "Free"
      : `$${(event.priceCents / 100).toFixed(2)}`;

  const whenLabel = new Date(event.startsAt).toLocaleString(undefined, {
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
      cityName={city?.name ?? ""}
      hostName={hostName}
      priceLabel={price}
      whenLabel={whenLabel}
    />
  );
}
