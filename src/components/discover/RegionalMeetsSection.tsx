"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  LocateFixed,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { EventCard } from "@/components/events/EventCard";
import { Reveal } from "@/components/providers/Reveal";
import { INDIA_METRO_CITY_IDS } from "@/lib/geo/suggestCityId";
import { hostLabelForEvent } from "@/lib/hostName";
import { isMeetInactive, listEventsMerged } from "@/lib/eventsCatalog";
import { selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import {
  REGIONAL_METRO_PICKER_EVENT,
  type RegionalMetroPickerDetail,
} from "@/lib/ui/regionalMetroPicker";
import { useBodyLock } from "@/lib/ui/useBodyLock";
import { cn } from "@/lib/utils";
import type { CityOption } from "./filterTypes";

const PREFERRED_KEY = "gc-preferred-region-city";

type GeoHintResponse = {
  suggestedCityId: string | null;
  cityLabel: string | null;
  regionLabel?: string | null;
  countryCode?: string | null;
};

type RegionalMeetsSectionProps = {
  cities: CityOption[];
  className?: string;
  title?: string;
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

  const indiaCities = useMemo(
    () => cities.filter((c) => INDIA_METRO_CITY_IDS.has(c.id)),
    [cities],
  );

  const [regionCityId, setRegionCityId] = useState<string>("");
  const [hintLabel, setHintLabel] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const filteredIndiaCities = useMemo(() => {
    const q = citySearchQuery.trim().toLowerCase();
    if (!q) return indiaCities;
    return indiaCities.filter((c) => c.name.toLowerCase().includes(q));
  }, [indiaCities, citySearchQuery]);

  const applyHint = useCallback(
    (data: GeoHintResponse, opts?: { silent?: boolean }) => {
      const id = data.suggestedCityId;
      if (!id || !indiaCities.some((c) => c.id === id)) return false;
      setRegionCityId(id);
      const label =
        data.cityLabel?.trim() || data.regionLabel?.trim() || null;
      setHintLabel(label);
      try {
        localStorage.setItem(PREFERRED_KEY, id);
      } catch {
        /* ignore */
      }
      if (!opts?.silent) {
        const name =
          indiaCities.find((c) => c.id === id)?.name ?? label ?? "this metro";
        toast.success(`Area set to ${name}`);
      }
      return true;
    },
    [indiaCities],
  );

  const fetchAndApplyHint = useCallback(
    async (opts?: { silent?: boolean }) => {
      const res = await fetch("/api/geo/hint");
      if (!res.ok) return false;
      const data = (await res.json()) as GeoHintResponse;
      return applyHint(data, opts);
    },
    [applyHint],
  );

  useEffect(() => {
    let cancelled = false;
    try {
      const stored = localStorage.getItem(PREFERRED_KEY);
      if (stored && indiaCities.some((c) => c.id === stored)) {
        setRegionCityId(stored);
        return;
      }
    } catch {
      /* ignore */
    }

    void (async () => {
      try {
        const ok = await fetchAndApplyHint({ silent: true });
        if (!cancelled && !ok) {
          /* no toast on silent initial miss */
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [indiaCities, fetchAndApplyHint]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!pickerOpen) {
      setCitySearchQuery("");
      return;
    }
    window.dispatchEvent(
      new CustomEvent<RegionalMetroPickerDetail>(REGIONAL_METRO_PICKER_EVENT, {
        detail: { open: true },
      }),
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent<RegionalMetroPickerDetail>(
          REGIONAL_METRO_PICKER_EVENT,
          { detail: { open: false } },
        ),
      );
    };
  }, [pickerOpen]);

  useBodyLock(pickerOpen);

  useEffect(() => {
    if (pickerOpen) {
      document.documentElement.dataset.gcMetroPickerOpen = "1";
    } else {
      delete document.documentElement.dataset.gcMetroPickerOpen;
    }
  }, [pickerOpen]);

  const onSelectCity = (id: string) => {
    setRegionCityId(id);
    setHintLabel(null);
    try {
      if (id) localStorage.setItem(PREFERRED_KEY, id);
      else localStorage.removeItem(PREFERRED_KEY);
    } catch {
      /* ignore */
    }
    setPickerOpen(false);
  };

  const onDetectArea = async () => {
    setDetecting(true);
    try {
      const res = await fetch("/api/geo/hint");
      if (!res.ok) {
        toast.message("Couldn’t detect your metro automatically", {
          description: "Choose your city from the list.",
        });
        return;
      }
      const data = (await res.json()) as GeoHintResponse;
      const ok = applyHint(data, { silent: false });
      if (!ok) {
        toast.message("Couldn’t detect your metro automatically", {
          description: "Choose your city from the list.",
        });
      }
    } catch {
      toast.error("Detection failed. Choose your city from the list.");
    } finally {
      setDetecting(false);
      setPickerOpen(false);
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

  const cityById = Object.fromEntries(indiaCities.map((c) => [c.id, c.name]));
  const regionName = regionCityId
    ? cityById[regionCityId] ?? regionCityId
    : "";

  const selectedLabel = regionCityId
    ? cityById[regionCityId] ?? "Metro"
    : "Choose your metro";

  return (
    <section
      className={cn(
        "mt-12 rounded-2xl border border-primary/10 bg-linear-to-b from-white to-primary/4 p-5 shadow-sm sm:p-8",
        className,
      )}
      aria-labelledby="regional-meets-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
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
            Upcoming public meets by metro — India cities only.
          </p>
          {regionCityId && hintLabel ? (
            <p className="mt-2 text-xs font-medium text-neutral-500">
              {(() => {
                const metro = cityById[regionCityId];
                const extra =
                  hintLabel.toLowerCase() !== metro?.toLowerCase()
                    ? ` · ${hintLabel}`
                    : "";
                return `Metro: ${metro}${extra}`;
              })()}
            </p>
          ) : null}
        </div>

        <div
          ref={pickerRef}
          className="relative w-full shrink-0 lg:max-w-[min(100%,320px)]"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Metro
          </p>
          <button
            type="button"
            id="regional-city-picker-trigger"
            aria-haspopup="listbox"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((o) => !o)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200/90 bg-white px-4 py-3 text-left shadow-sm transition",
              "hover:border-primary/25 hover:bg-neutral-50/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              pickerOpen && "border-primary/35 ring-2 ring-primary/15",
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <span className="truncate text-sm font-semibold text-neutral-900">
                {selectedLabel}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-neutral-400 transition-transform",
                pickerOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {pickerOpen ? (
            <div
              className="absolute right-0 top-full z-50 mt-2 flex max-h-[min(85vh,400px)] w-full min-w-[min(100vw-2rem,320px)] flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-xl ring-1 ring-black/5 sm:min-w-[300px]"
              role="listbox"
              aria-labelledby="regional-city-picker-trigger"
            >
              <button
                type="button"
                disabled={detecting}
                onClick={() => void onDetectArea()}
                className="flex shrink-0 items-center gap-3 border-b border-neutral-100 bg-linear-to-r from-primary/[0.07] to-transparent px-4 py-3.5 text-left transition hover:from-primary/12 disabled:opacity-60"
              >
                {detecting ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                ) : (
                  <LocateFixed className="h-5 w-5 shrink-0 text-primary" />
                )}
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    Detect my area
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    Uses your connection to suggest a metro
                  </span>
                </span>
              </button>
              <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
                <label className="sr-only" htmlFor="regional-metro-search">
                  Search metros
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                  />
                  <input
                    id="regional-metro-search"
                    type="search"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    placeholder="Search cities…"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 py-2.5 pl-9 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/15"
                    autoComplete="off"
                    autoCorrect="off"
                  />
                </div>
              </div>
              <ul
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 touch-pan-y"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {filteredIndiaCities.length === 0 ? (
                  <li className="px-3 py-4 text-center text-sm text-neutral-500">
                    No matches
                  </li>
                ) : (
                  filteredIndiaCities.map((c) => {
                    const active = c.id === regionCityId;
                    return (
                      <li key={c.id} role="none">
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => onSelectCity(c.id)}
                          className={cn(
                            "flex w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                            active
                              ? "bg-primary/12 text-primary"
                              : "text-neutral-800 hover:bg-neutral-100",
                          )}
                        >
                          {c.name}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {!regionCityId ? null : events.length === 0 ? (
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
