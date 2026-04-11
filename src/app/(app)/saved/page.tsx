"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import { mergeEventCatalog } from "@/lib/eventsCatalog";
import { hostNameForUserId } from "@/lib/hostName";
import { EventCard } from "@/components/events/EventCard";
import citiesData from "@/data/cities.json";
import type { City, MeetEvent } from "@/lib/types";

export default function SavedPage() {
  const savedIds = useSessionStore((s) => s.savedEventIds);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const sessionUser = useSessionStore((s) => s.user);
  const seedDemoSavedIfEmpty = useSessionStore((s) => s.seedDemoSavedIfEmpty);

  useEffect(() => {
    seedDemoSavedIfEmpty();
  }, [seedDemoSavedIfEmpty]);

  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents),
    [hostedEvents],
  );

  const saved = useMemo(() => {
    const list: MeetEvent[] = [];
    for (const id of savedIds) {
      const e = catalog.find((x) => x.id === id);
      if (e) list.push(e);
    }
    return list;
  }, [catalog, savedIds]);

  return (
    <div className="mx-auto max-w-5xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-8">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          Saved
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
          Meets you bookmarked while signed in. Sample events are added when your
          list is empty (demo).
        </p>
      </div>

      {saved.length === 0 ? (
        <p className="mt-8 text-sm font-medium text-neutral-900">
          Nothing saved — browse{" "}
          <Link
            href="/explore"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Explore
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((e, index) => (
            <EventCard
              key={e.id}
              event={e}
              cityName={cityById[e.cityId] ?? ""}
              hostName={
                sessionUser && e.hostUserId === sessionUser.id
                  ? sessionUser.name
                  : hostNameForUserId(e.hostUserId) ?? "Host"
              }
              priority={index < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}
