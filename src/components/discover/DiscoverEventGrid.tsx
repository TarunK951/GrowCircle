"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EventCard } from "@/components/events/EventCard";
import { Reveal } from "@/components/providers/Reveal";
import { hostLabelForEvent } from "@/lib/hostName";
import { listEventsMerged } from "@/lib/eventsCatalog";
import { useSessionStore } from "@/stores/session-store";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

export function DiscoverEventGrid() {
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const user = useSessionStore((s) => s.user);
  const sp = useSearchParams();
  const city = sp.get("city") ?? "";
  const category = sp.get("category") ?? "all";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";

  const events = useMemo(
    () =>
      listEventsMerged(
        hostedEvents,
        {
          cityId: city || undefined,
          category: category || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          publicOnly: true,
        },
        circleCatalogEvents,
      ),
    [hostedEvents, circleCatalogEvents, city, category, dateFrom, dateTo],
  );

  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e, index) => (
        <Reveal key={e.id}>
          <EventCard
            event={e}
            cityName={e.displayLocation ?? cityById[e.cityId] ?? ""}
            hostName={hostLabelForEvent(e, user)}
            priority={index < 3}
          />
        </Reveal>
      ))}
    </div>
  );
}
