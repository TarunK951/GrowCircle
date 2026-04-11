import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { getEvent, getUser } from "@/lib/mockApi";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";
import { JoinMeetButton, SaveEventButton } from "./ui";

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

  const price =
    event.priceCents === 0
      ? "Free"
      : `$${(event.priceCents / 100).toFixed(2)}`;

  return (
    <Container className="page-shell">
      <Link
        href="/explore"
        className="text-sm font-medium text-primary hover:underline"
      >
        ← Back to explore
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="liquid-glass-surface relative aspect-[4/3] overflow-hidden !p-0">
          <Image
            src={event.image}
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="liquid-glass-surface flex flex-col">
          <p className="text-sm font-semibold text-primary">
            {event.category} · {city?.name}
          </p>
          <h1 className="font-onest mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {event.title}
          </h1>
          <p className="mt-4 leading-relaxed text-muted">{event.description}</p>
          <ul className="mt-6 space-y-2.5 text-sm">
            <li>
              <span className="font-medium text-foreground">When:</span>{" "}
              {new Date(event.startsAt).toLocaleString()}
            </li>
            <li>
              <span className="font-medium text-foreground">Where:</span>{" "}
              {event.venueName ?? "Details shared after booking"}
            </li>
            <li>
              <span className="font-medium text-foreground">Host:</span>{" "}
              {host?.name ?? "Host"}
            </li>
            <li>
              <span className="font-medium text-foreground">Spots:</span>{" "}
              {event.capacity}
            </li>
            <li>
              <span className="font-medium text-foreground">Price:</span>{" "}
              {price}
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-4">
            <JoinMeetButton eventId={event.id} />
            <SaveEventButton eventId={event.id} />
          </div>
        </div>
      </div>
    </Container>
  );
}
