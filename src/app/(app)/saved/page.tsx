"use client";

import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import eventsData from "@/data/events.json";
import { EventCard } from "@/components/events/EventCard";
import citiesData from "@/data/cities.json";
import type { City, MeetEvent } from "@/lib/types";

export default function SavedPage() {
  const savedIds = useSessionStore((s) => s.savedEventIds);
  const events = eventsData as MeetEvent[];
  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));
  const saved = events.filter((e) => savedIds.includes(e.id));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
      <p className="mt-2 text-muted">Events you bookmarked while signed in.</p>
      {saved.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          Nothing saved — browse{" "}
          <Link href="/explore" className="text-primary">
            explore
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {saved.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              cityName={cityById[e.cityId] ?? ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
