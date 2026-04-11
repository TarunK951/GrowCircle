import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { EventMeetDetail } from "@/components/events/EventMeetDetail";
import { resolveEventDetail } from "@/lib/eventDetail";
import { getEvent, getUser } from "@/lib/mockApi";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

type EventPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function EventDetailPage(props: EventPageProps) {
  const { id } = await props.params;
  const event = await getEvent(id);
  if (!event) notFound();
  const host = await getUser(event.hostUserId);
  const cities = citiesData as City[];
  const city = cities.find((c) => c.id === event.cityId);
  const detail = resolveEventDetail(event);

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
    <Container className="page-shell">
      <EventMeetDetail
        event={event}
        detail={detail}
        cityName={city?.name ?? ""}
        hostName={host?.name ?? "Host"}
        priceLabel={price}
        whenLabel={whenLabel}
      />
    </Container>
  );
}
