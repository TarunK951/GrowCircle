"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import usersSeed from "@/data/users.seed.json";
import citiesData from "@/data/cities.json";
import { useResolvedEvent } from "@/hooks/useResolvedEvent";
import type { City, User } from "@/lib/types";

const icebreakers = [
  "What’s one thing you’re excited about this month?",
  "Coffee person, tea person, or “surprise me”?",
  "What’s a hobby you’ve always wanted to try?",
];

export function GroupPageView({ id }: { id: string }) {
  const { event, loading } = useResolvedEvent(id);
  if (loading) {
    return (
      <p className="text-sm text-neutral-600">Loading…</p>
    );
  }
  if (!event) notFound();

  const seed = usersSeed as User[];
  const host = seed.find((u) => u.id === event.hostUserId);
  const cities = citiesData as City[];
  const city = cities.find((c) => c.id === event.cityId);

  const roster: User[] = [
    ...(host ? [host] : []),
    ...seed.filter((u) => u.id !== host?.id),
  ];
  const displayMembers = roster.slice(0, 5);

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
        Your group
      </p>
      <h1 className="font-onest mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {event.title}
      </h1>
      <p className="mt-2 text-muted">
        {event.displayLocation ?? city?.name ?? "City"} ·{" "}
        {new Date(event.startsAt).toLocaleString()}
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Who&apos;s coming</h2>
        <ul className="mt-4 space-y-3">
          {displayMembers.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-[var(--radius-section)] border border-primary/10 bg-white/60 px-4 py-3"
            >
              <Image
                src={u.avatar}
                alt=""
                width={44}
                height={44}
                className="rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{u.name}</p>
                <p className="text-xs text-muted">
                  {u.interests.slice(0, 2).join(" · ") || "Member"}
                </p>
              </div>
              {u.verified && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Verified
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Icebreakers</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
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
          Open chat
        </Link>
      </div>
    </div>
  );
}
