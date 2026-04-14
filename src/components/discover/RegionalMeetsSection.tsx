"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Sparkles } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { Reveal } from "@/components/providers/Reveal";
import { hostLabelForEvent } from "@/lib/hostName";
import {
  isMeetInactive,
  listEventsMerged,
} from "@/lib/eventsCatalog";
import { selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";
import type { CityOption } from "./filterTypes";

const PREFERRED_KEY = "gc-preferred-region-city";

type RegionalMeetsSectionProps = {
  cities: CityOption[];
  /** Extra classes on the outer card (e.g. `mt-0` on the landing page). */
  className?: string;
  /** Main heading; default matches discover. */
  title?: string;
  /** Small label above the title. */
  eyebrow?: string;
};

export function RegionalMeetsSection({
  cities,
  className,
  title = "Meets in your region",
  eyebrow = "Near you",
}: RegionalMeetsSectionProps) {
  const user = useAppSelector(selectUser);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);

  const [regionCityId, setRegionCityId] = useState<string>("");
  const [hintLabel, setHintLabel] = useState<string | null>(null);
  const [hintLoaded, setHintLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      const stored = localStorage.getItem(PREFERRED_KEY);
      if (stored && cities.some((c) => c.id === stored)) {
        setRegionCityId(stored);
        setHintLoaded(true);
        return;
      }
    } catch {
      /* ignore */
    }

    void (async () => {
      try {
        const res = await fetch("/api/geo/hint");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          suggestedCityId: string | null;
          cityLabel: string | null;
        };
        if (cancelled) return;
        if (
          data.suggestedCityId &&
          cities.some((c) => c.id === data.suggestedCityId)
        ) {
          setRegionCityId(data.suggestedCityId);
          if (data.cityLabel) setHintLabel(data.cityLabel);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHintLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cities]);

  const onSelectCity = (id: string) => {
    setRegionCityId(id);
    try {
      if (id) localStorage.setItem(PREFERRED_KEY, id);
      else localStorage.removeItem(PREFERRED_KEY);
    } catch {
      /* ignore */
    }
  };

  const events = useMemo(() => {
    if (!regionCityId) return [];
    let list = listEventsMerged(
      hostedEvents,
      { cityId: regionCityId, publicOnly: true },
      circleCatalogEvents,
    );
    list = list.filter((e) => !isMeetInactive(e));
    list.sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
    return list.slice(0, 9);
  }, [hostedEvents, circleCatalogEvents, regionCityId]);

  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));
  const regionName = regionCityId
    ? cityById[regionCityId] ?? regionCityId
    : "";

  if (!hintLoaded && !regionCityId) {
    return (
      <div
        className={cn(
          "mt-12 rounded-2xl border border-neutral-200/80 bg-white/60 px-5 py-10 text-center text-sm text-neutral-600",
          className,
        )}
      >
        Finding meets near you…
      </div>
    );
  }

  return (
    <section
      className={cn(
        "mt-12 rounded-2xl border border-primary/10 bg-linear-to-b from-white to-primary/4 p-5 shadow-sm sm:p-8",
        className,
      )}
      aria-labelledby="regional-meets-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {eyebrow}
          </p>
          <h2
            id="regional-meets-heading"
            className="font-onest mt-2 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl"
          >
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            We suggest a city from your approximate location (IP). Pick another
            city anytime — your choice is saved on this device only.
          </p>
          {hintLabel && regionCityId ? (
            <p className="mt-2 text-xs text-neutral-500">
              Approximate area: {hintLabel}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-1.5 sm:min-w-[220px]">
          <label
            htmlFor="regional-city-select"
            className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
          >
            Location
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <select
              id="regional-city-select"
              value={regionCityId}
              onChange={(e) => onSelectCity(e.target.value)}
              className={cn(
                "w-full appearance-none rounded-xl border border-neutral-300 bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-neutral-900 shadow-sm",
                "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
              )}
            >
              <option value="">Select a city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!regionCityId ? (
        <p className="mt-8 text-center text-sm text-neutral-600">
          Choose a city to see upcoming public meets there.
        </p>
      ) : events.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-200 bg-white/80 px-5 py-10 text-center">
          <p className="font-onest text-sm font-semibold text-neutral-900">
            No upcoming meets in {regionName} yet
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Try another city or open Explore to see every public meet.
          </p>
          <Link
            href={`/explore?city=${encodeURIComponent(regionCityId)}`}
            className="mt-4 inline-flex text-sm font-semibold text-primary underline"
          >
            Open explore with {regionName}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, index) => (
              <Reveal key={e.id} className="h-full">
                <EventCard
                  event={e}
                  cityName={e.displayLocation ?? cityById[e.cityId] ?? ""}
                  hostName={hostLabelForEvent(e, user)}
                  priority={index < 3}
                />
              </Reveal>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href={`/explore?city=${encodeURIComponent(regionCityId)}`}
              className="inline-flex rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              See all in {regionName}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
