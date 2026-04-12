"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import citiesData from "@/data/cities.json";
import { useResolvedEvent } from "@/hooks/useResolvedEvent";
import type { City } from "@/lib/types";

const icebreakers = [
  "What’s one thing you’re excited about this month?",
  "Coffee person, tea person, or “surprise me”?",
  "What’s a hobby you’ve always wanted to try?",
];

export function GroupPageView({ id }: { id: string }) {
  const { event, loading } = useResolvedEvent(id);
  if (loading) {
    return (
      <p className="text-sm text-neutral-900">Loading…</p>
    );
  }
  if (!event) notFound();

  const cities = citiesData as City[];
  const city = cities.find((c) => c.id === event.cityId);
  const hostLabel = event.hostUsername?.trim() || "Host";

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
        Your group
      </p>
      <h1 className="font-onest mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {event.title}
      </h1>
      <p className="mt-2 text-neutral-900">
        {event.displayLocation ?? city?.name ?? "City"} ·{" "}
        {new Date(event.startsAt).toLocaleString()}
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Host</h2>
        <p className="mt-2 text-sm text-neutral-800">
          <span className="font-medium">@{hostLabel}</span>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Who&apos;s coming</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
          Confirmed attendee names and profiles are managed in the Circle app
          flow. As a guest, check your ticket and notifications for updates.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Icebreakers</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-neutral-900">
          {icebreakers.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href={`/event/${event.id}`}
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Event details
        </Link>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Messages
        </Link>
      </div>
    </div>
  );
}
