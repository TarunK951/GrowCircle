"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { listSavedEvents, toggleSavedEvent } from "@/lib/circle/savedEventsApi";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type { CircleEvent } from "@/lib/circle/types";
import { circleEventToMeetEvent } from "@/lib/circle/mappers";
import { selectAccessToken, selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import { isMeetInactive, mergeEventCatalog } from "@/lib/eventsCatalog";
import { hostLabelForEvent } from "@/lib/hostName";
import { EventCard } from "@/components/events/EventCard";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

export default function SavedPage() {
  const accessToken = useAppSelector(selectAccessToken);
  const savedIds = useSessionStore((s) => s.savedEventIds);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const removeSavedEventIds = useSessionStore((s) => s.removeSavedEventIds);
  const toggleSaved = useSessionStore((s) => s.toggleSaved);
  const setEventSaved = useSessionStore((s) => s.setEventSaved);
  const setSavedEventIds = useSessionStore((s) => s.setSavedEventIds);
  const upsertCircleCatalogEvent = useSessionStore(
    (s) => s.upsertCircleCatalogEvent,
  );
  const sessionUser = useAppSelector(selectUser);

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken) return;
    let cancelled = false;
    void listSavedEvents(accessToken, { page: 1, limit: 100 })
      .then(({ data }) => {
        if (cancelled || !Array.isArray(data)) return;
        const ids = data
          .map((row) => {
            const r = row as CircleEvent;
            return typeof r.id === "string" ? r.id : "";
          })
          .filter(Boolean);
        const prev = useSessionStore.getState().savedEventIds;
        setSavedEventIds([...new Set([...prev, ...ids])]);
        for (const row of data) {
          const ev = row as CircleEvent;
          if (ev.id && ev.title) {
            upsertCircleCatalogEvent(circleEventToMeetEvent(ev));
          }
        }
      })
      .catch(() => {
        /* offline / older backend */
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, setSavedEventIds, upsertCircleCatalogEvent]);

  const unsave = (id: string) => {
    const run = async () => {
      if (isCircleApiConfigured() && accessToken) {
        try {
          const res = await toggleSavedEvent(accessToken, id);
          setEventSaved(id, Boolean(res.saved));
          toast.success(res.saved ? "Saved for later" : "Removed from saved");
        } catch {
          toggleSaved(id);
          toast.success("Removed from saved");
          toast.message("Updated locally — server sync unavailable.");
        }
        return;
      }
      toggleSaved(id);
      toast.success("Removed from saved");
    };
    void run();
  };

  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents, circleCatalogEvents),
    [hostedEvents, circleCatalogEvents],
  );

  /** Upcoming / unknown-id bookmarks only (past meets are hidden). */
  const visibleSaved = useMemo(
    () =>
      savedIds
        .map((id) => ({ id, event: catalog.find((x) => x.id === id) }))
        .filter(({ event }) => !event || !isMeetInactive(event)),
    [savedIds, catalog],
  );

  useEffect(() => {
    const toRemove = savedIds.filter((id) => {
      const e = catalog.find((x) => x.id === id);
      return Boolean(e && isMeetInactive(e));
    });
    if (toRemove.length > 0) removeSavedEventIds(toRemove);
  }, [savedIds, catalog, removeSavedEventIds]);

  const hasUpcomingOrUnknown = visibleSaved.length > 0;

  return (
    <div className="mx-auto max-w-5xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-8">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          Saved
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
          Upcoming meets you bookmarked while signed in
          {isCircleApiConfigured() ? " (synced when the Circle API is available)" : ""}.
          Past meets are removed from this list automatically.
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
      ) : !hasUpcomingOrUnknown ? (
        <p className="mt-8 text-sm font-medium text-neutral-900">
          No upcoming saved meets — your past bookmarks were cleared from this
          list. Browse{" "}
          <Link
            href="/explore"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Explore
          </Link>{" "}
          for more.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSaved.map(({ id, event: e }, index) => {
            if (!e) {
              return (
                <div
                  key={id}
                  className="relative flex flex-col overflow-hidden rounded-(--radius-section) border border-neutral-200 bg-neutral-50 grayscale saturate-0 contrast-[0.92]"
                >
                  <button
                    type="button"
                    onClick={() => unsave(id)}
                    className="absolute right-2 top-2 z-10 rounded-full border border-white/80 bg-black/45 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-black/55"
                  >
                    Remove
                  </button>
                  <div className="aspect-4/3 w-full bg-neutral-200" />
                  <div className="border-t border-neutral-200 p-5">
                    <p className="font-onest text-lg font-semibold text-neutral-900">
                      No longer available
                    </p>
                    <p className="mt-2 text-sm text-neutral-900">
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
                hostName={hostLabelForEvent(e, sessionUser)}
                priority={index < 3}
                inactive={false}
                monochromeListing
                onUnsave={() => unsave(e.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
