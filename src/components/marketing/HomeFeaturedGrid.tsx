"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { EventCard } from "@/components/events/EventCard";
import { Reveal } from "@/components/providers/Reveal";
import { hostLabelForEvent } from "@/lib/hostName";
import { listEventsMerged } from "@/lib/eventsCatalog";
import { useSessionStore } from "@/stores/session-store";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

export function HomeFeaturedGrid() {
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const user = useSessionStore((s) => s.user);

  const featured = useMemo(() => {
    const list = listEventsMerged(
      hostedEvents,
      { publicOnly: true },
      circleCatalogEvents,
    );
    return list.slice(0, 3);
  }, [hostedEvents, circleCatalogEvents]);

  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  return (
    <section className="border-t border-primary/10 py-16 sm:py-20">
      <Container>
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
              Featured
            </p>
            <h2 className="font-onest mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Featured meets
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">
              A snapshot of what&apos;s happening—open an event for full details and
              to save your spot.
            </p>
          </div>
          <Link
            href="/explore"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((e, index) => (
            <Reveal key={e.id}>
              <EventCard
                event={e}
                cityName={e.displayLocation ?? cityById[e.cityId] ?? "City"}
                hostName={hostLabelForEvent(e, user)}
                priority={index < 3}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
