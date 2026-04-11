"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import { isMeetInactive, mergeEventCatalog } from "@/lib/eventsCatalog";
import { hostNameForUserId } from "@/lib/hostName";
import { EventCard } from "@/components/events/EventCard";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

export default function SavedPage() {
  const savedIds = useSessionStore((s) => s.savedEventIds);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const sessionUser = useSessionStore((s) => s.user);
  const seedDemoSavedIfEmpty = useSessionStore((s) => s.seedDemoSavedIfEmpty);

  useEffect(() => {
    seedDemoSavedIfEmpty();
  }, [seedDemoSavedIfEmpty]);

  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents, circleCatalogEvents),
    [hostedEvents, circleCatalogEvents],
  );

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

      {savedIds.length === 0 ? (
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
          {savedIds.map((id, index) => {
            const e = catalog.find((x) => x.id === id);
            if (!e) {
              return (
                <div
                  key={id}
                  className="flex flex-col overflow-hidden rounded-(--radius-section) border border-neutral-200 bg-neutral-50 grayscale"
                >
                  <div className="aspect-4/3 w-full bg-neutral-200" />
                  <div className="border-t border-neutral-200 p-5">
                    <p className="font-onest text-lg font-semibold text-neutral-700">
                      No longer available
                    </p>
                    <p className="mt-2 text-sm text-neutral-600">
                      This meet was removed by the host or is no longer listed.
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <EventCard
                key={e.id}
                event={e}
                cityName={e.displayLocation ?? cityById[e.cityId] ?? ""}
                hostName={
                  sessionUser && e.hostUserId === sessionUser.id
                    ? sessionUser.name
                    : hostNameForUserId(e.hostUserId) ?? "Host"
                }
                priority={index < 3}
                inactive={isMeetInactive(e)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
