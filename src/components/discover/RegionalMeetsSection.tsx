"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2, LocateFixed, Search } from "lucide-react";
import { toast } from "sonner";
import { EventCard } from "@/components/events/EventCard";
import { Reveal } from "@/components/providers/Reveal";
import { requestBrowserCoordinates } from "@/lib/geo/requestBrowserCoordinates";
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
import { Container } from "@/components/layout/Container";
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
  /**
   * When true (default), if the user has no saved metro we open the picker once per tab session.
   * Set false on marketing home so the hero isn’t interrupted.
   */
  askForMetroOnMount?: boolean;
  /** Discover toolbar filters from the URL — keeps the grid in sync with search / filters. */
  exploreFilters?: {
    city?: string;
    search?: string;
    category?: string;
    /** YYYY-MM-DD */
    date?: string;
  };
  /** When set (e.g. `/explore`), shows a “View all events” control — omit on Discover itself. */
  viewAllEventsHref?: string;
  /**
   * When true, render nothing if there are no upcoming meets for the current region / filters.
   * Use on the marketing home so the block disappears instead of an empty state.
   */
  hideWhenEmpty?: boolean;
  /**
   * When true, wraps the card in the gray marketing band + `Container` (home page only).
   * Ignored when `hideWhenEmpty` hides the section.
   */
  homePageSurface?: boolean;
};

export function RegionalMeetsSection({
  cities,
  className,
  title = "Meets in your region",
  eyebrow = "Near you",
  askForMetroOnMount = true,
  exploreFilters,
  viewAllEventsHref,
  hideWhenEmpty = false,
  homePageSurface = false,
}: RegionalMeetsSectionProps) {
  const user = useAppSelector(selectUser);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);

  const indiaCities = useMemo(
    () => cities.filter((c) => INDIA_METRO_CITY_IDS.has(c.id)),
    [cities],
  );

  const allCityById = useMemo(
    () => Object.fromEntries(cities.map((c) => [c.id, c.name])),
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
          indiaCities.find((c) => c.id === id)?.name ?? label ?? "this area";
        toast.success(`Area set to ${name}`);
      }
      return true;
    },
    [indiaCities],
  );

  /** Restore saved metro only after explicit pick; no auto geo. Ask for location once per session if none saved. */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERRED_KEY);
      if (stored && indiaCities.some((c) => c.id === stored)) {
        setRegionCityId(stored);
        return;
      }
    } catch {
      /* ignore */
    }
    if (!askForMetroOnMount) return;
    try {
      if (sessionStorage.getItem("gc-regional-metro-asked") === "1") return;
      sessionStorage.setItem("gc-regional-metro-asked", "1");
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setPickerOpen(true), 450);
    return () => window.clearTimeout(t);
  }, [indiaCities, askForMetroOnMount]);

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

  const expCity = exploreFilters?.city?.trim() ?? "";
  const expSearch = exploreFilters?.search?.trim() ?? "";
  const expCategory = exploreFilters?.category?.trim() ?? "all";
  const expDate = exploreFilters?.date?.trim() ?? "";

  /** URL toolbar city wins so Discover filters and the grid stay aligned. */
  const effectiveCityId = expCity || regionCityId;
  const listNarrowedByCity = Boolean(expCity || regionCityId);

  const events = useMemo(() => {
    let list = listEventsMerged(
      hostedEvents,
      {
        ...(effectiveCityId ? { cityId: effectiveCityId } : {}),
        ...(expSearch ? { search: expSearch } : {}),
        ...(expCategory && expCategory !== "all"
          ? { category: expCategory }
          : {}),
        ...(expDate ? { date: expDate } : {}),
        publicOnly: true,
        searchContextUser: user,
      },
      circleCatalogEvents,
    );
    list = list.filter((e) => !isMeetInactive(e));
    list.sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
    return list.slice(0, listNarrowedByCity ? 9 : 18);
  }, [
    hostedEvents,
    circleCatalogEvents,
    effectiveCityId,
    expSearch,
    expCategory,
    expDate,
    listNarrowedByCity,
    user,
  ]);

  const regionName = regionCityId
    ? allCityById[regionCityId] ?? regionCityId
    : "";

  const displayRegionName = effectiveCityId
    ? allCityById[effectiveCityId] ?? effectiveCityId
    : "";

  const selectedLabel = regionCityId
    ? allCityById[regionCityId] ?? "Location"
    : "";

  const hasExploreQuery =
    Boolean(expSearch) ||
    (Boolean(expCategory) && expCategory !== "all") ||
    Boolean(expDate);

  /** Closed: show selected metro name; open: filter query. */
  const metroInputValue = pickerOpen
    ? citySearchQuery
    : selectedLabel;

  const openMetroPicker = () => {
    setPickerOpen(true);
    setCitySearchQuery("");
  };

  const onMetroSearchFocus = () => {
    if (!pickerOpen) openMetroPicker();
  };

  const onDetectArea = async () => {
    setDetecting(true);
    try {
      const coords = await requestBrowserCoordinates();
      if (coords) {
        const post = await fetch("/api/geo/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(coords),
        });
        if (post.ok) {
          const geo = (await post.json()) as GeoHintResponse;
          if (applyHint(geo, { silent: false })) {
            return;
          }
        }
      }

      const res = await fetch("/api/geo/hint");
      if (res.ok) {
        const geo = (await res.json()) as GeoHintResponse;
        if (applyHint(geo, { silent: false })) {
          return;
        }
      }

      toast.message("Couldn’t detect your area automatically", {
        description: "Choose your city from the list.",
      });
    } catch {
      toast.error("Detection failed. Choose your city from the list.");
    } finally {
      setDetecting(false);
      setPickerOpen(false);
    }
  };

  if (hideWhenEmpty && events.length === 0) {
    return null;
  }

  const innerSection = (
    <section
      className={cn(
        "mt-12 overflow-hidden rounded-[1.75rem] border border-black/6 bg-white p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.09)] sm:p-9",
        homePageSurface && "mt-0",
        className,
      )}
      aria-labelledby="regional-meets-heading"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
            {eyebrow}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <h2
              id="regional-meets-heading"
              className="font-onest text-[1.625rem] font-semibold leading-snug tracking-tight text-neutral-900 sm:text-[1.875rem]"
            >
              {title}
            </h2>
            {viewAllEventsHref ? (
              <Link
                href={viewAllEventsHref}
                className="group inline-flex shrink-0 items-center justify-center gap-1 self-start rounded-full border border-neutral-200/90 bg-neutral-50/80 px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:border-neutral-300 hover:bg-white hover:shadow-md active:scale-[0.99] sm:self-auto"
              >
                View all events
                <ChevronRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ) : null}
          </div>
          {regionCityId && hintLabel ? (
            <p className="text-xs font-medium leading-relaxed text-neutral-500">
              Location: {regionName}
              {hintLabel.toLowerCase() !== regionName.toLowerCase()
                ? ` · ${hintLabel}`
                : ""}
            </p>
          ) : null}
        </div>

        <div
          ref={pickerRef}
          className="relative w-full shrink-0 lg:max-w-[min(100%,300px)]"
        >
          <div
            id="regional-city-picker-trigger"
            className={cn(
              "flex w-full items-stretch rounded-full border border-neutral-200/80 bg-neutral-50/90 transition",
              "focus-within:border-neutral-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]",
              pickerOpen &&
                "border-neutral-300 bg-white shadow-[0_0_0_3px_rgba(0,0,0,0.05)]",
            )}
          >
            <label className="sr-only" htmlFor="regional-metro-search">
              Location
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <input
                id="regional-metro-search"
                type="search"
                role="combobox"
                aria-expanded={pickerOpen}
                aria-haspopup="listbox"
                aria-controls="regional-metro-listbox"
                autoComplete="off"
                autoCorrect="off"
                placeholder={
                  regionCityId
                    ? "Search to change location…"
                    : "Choose your location…"
                }
                readOnly={!pickerOpen}
                value={metroInputValue}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                onFocus={onMetroSearchFocus}
                className={cn(
                  "w-full min-h-11 rounded-l-full border-0 bg-transparent py-3 pl-9 pr-2 text-sm font-medium text-neutral-900 outline-none transition placeholder:font-normal placeholder:text-neutral-400",
                  !pickerOpen && "cursor-pointer",
                )}
              />
            </div>
            <button
              type="button"
              tabIndex={-1}
              aria-label={pickerOpen ? "Close location list" : "Open location list"}
              onClick={() => (pickerOpen ? setPickerOpen(false) : openMetroPicker())}
              className="flex shrink-0 items-center justify-center rounded-r-full border-l border-neutral-200/60 px-3.5 text-neutral-400 transition hover:bg-white/80 hover:text-neutral-600"
            >
              <ChevronDown
                className={cn(
                  "h-5 w-5 transition-transform",
                  pickerOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </div>

          {pickerOpen ? (
            <div
              className="absolute right-0 top-full z-50 mt-2 flex max-h-[min(85vh,400px)] w-full min-w-[min(100vw-2rem,320px)] flex-col overflow-hidden rounded-2xl border border-black/6 bg-white/95 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md sm:min-w-[300px]"
              onWheel={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={detecting}
                onClick={() => void onDetectArea()}
                className="flex shrink-0 items-start gap-3 border-b border-neutral-100/90 bg-neutral-50/50 px-3 py-2.5 text-left transition hover:bg-neutral-50 disabled:opacity-60"
              >
                {detecting ? (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
                ) : (
                  <LocateFixed className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                )}
                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    Detect my area
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    Browser location when you allow it — otherwise your network
                  </span>
                </span>
              </button>
              <ul
                id="regional-metro-listbox"
                role="listbox"
                aria-label="Locations"
                aria-labelledby="regional-metro-search"
                className="scrollbar-none min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain p-2"
                style={{ WebkitOverflowScrolling: "touch" }}
                onWheel={(e) => e.stopPropagation()}
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
                              ? "bg-neutral-900/6 text-neutral-900"
                              : "text-neutral-700 hover:bg-neutral-100",
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

      {events.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-neutral-200/80 bg-neutral-50/40 px-5 py-12 text-center">
          <p className="font-onest text-sm font-semibold text-neutral-900">
            {hasExploreQuery
              ? "No meets match your filters"
              : effectiveCityId
                ? `No upcoming meets in ${displayRegionName} yet`
                : "No upcoming public meets right now"}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {hasExploreQuery
              ? "Try different keywords, or open Filters to adjust city, category, or date."
              : effectiveCityId
                ? "Try another location from the menu above, or check back later."
                : "Check back soon, or pick a location to see city-specific listings."}
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
          {events.map((e, index) => (
            <Reveal key={e.id} className="h-full">
              <EventCard
                event={e}
                cityName={
                  effectiveCityId
                    ? displayRegionName
                    : e.displayLocation ?? allCityById[e.cityId] ?? ""
                }
                hostName={hostLabelForEvent(e, user)}
                priority={index < 3}
              />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );

  if (homePageSurface) {
    return (
      <section className="border-t border-black/6 bg-[#f7f7f7] pb-16 pt-10 sm:pb-20 sm:pt-12">
        <Container>{innerSection}</Container>
      </section>
    );
  }

  return innerSection;
}
