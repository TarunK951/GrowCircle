"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EventCard } from "@/components/events/EventCard";
import { Reveal } from "@/components/providers/Reveal";
import { hostLabelForEvent } from "@/lib/hostName";
import { listEventsMerged } from "@/lib/eventsCatalog";
import { selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

export function DiscoverEventGrid() {
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const user = useAppSelector(selectUser);
  const sp = useSearchParams();
  const city = sp.get("city") ?? "";
  const category = sp.get("category") ?? "all";
  const date = sp.get("date") ?? "";
  const search = sp.get("search") ?? "";

  const events = useMemo(
    () =>
      listEventsMerged(
        hostedEvents,
        {
          cityId: city || undefined,
          category: category || undefined,
          date: date || undefined,
          search: search || undefined,
          publicOnly: true,
        },
        circleCatalogEvents,
      ),
    [hostedEvents, circleCatalogEvents, city, category, date, search],
  );

  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  if (events.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-6 py-12 text-center">
        <p className="font-onest text-base font-semibold text-foreground">
          No meets match these filters
        </p>
        <p className="mt-2 text-sm text-muted">
          Try clearing the date, widening the city, or searching with a
          different keyword.
        </p>
      </div>
    );
  }

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
