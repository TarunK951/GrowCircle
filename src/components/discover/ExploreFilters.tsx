"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, ChevronDown, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBodyLock } from "@/lib/ui/useBodyLock";
import { CityPickerModal } from "./CityPickerModal";
import type { CityOption } from "./filterTypes";

const fieldBtn =
  "liquid-glass-field liquid-glass-field-sm flex w-full min-h-11 items-center justify-between gap-2";

const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-300";

/** Stronger border than base liquid-glass so search is visible on light canvas. */
const searchInputClass = cn(
  "liquid-glass-field liquid-glass-field-sm w-full min-h-11 rounded-xl py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-zinc-400",
  "border border-neutral-300/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]",
  "focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
);

function CategorySelect({
  category,
  setCategory,
  categories,
  open,
  setOpen,
  native,
}: {
  category: string;
  setCategory: (v: string) => void;
  categories: string[];
  open: boolean;
  setOpen: (v: boolean) => void;
  /** Native select avoids overflow clipping inside drawers. */
  native?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, setOpen]);

  const categoryLabel =
    !category || category === "all" ? "All categories" : category;

  if (native) {
    return (
      <div className="relative min-w-0">
        <span className={labelCls}>Category</span>
        <select
          id="explore-filter-category-native"
          value={category === "all" ? "all" : category}
          onChange={(e) => setCategory(e.target.value)}
          className={cn(
            fieldBtn,
            "cursor-pointer appearance-none bg-transparent pr-8",
          )}
          aria-label="Category"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("relative min-w-0", open && "z-130")}
    >
      <span className={labelCls}>Category</span>
      <button
        type="button"
        id="explore-filter-category"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          fieldBtn,
          open && "liquid-glass-field-open",
        )}
        onClick={() => setOpen(!open)}
      >
        <span className="min-w-0 truncate text-left">{categoryLabel}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          className="liquid-glass-menu absolute left-0 right-0 top-full z-140 mt-1.5 max-h-56 overflow-auto rounded-xl p-1.5 text-sm shadow-lg ring-1 ring-black/5"
          role="listbox"
          aria-labelledby="explore-filter-category"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={category === "all"}
              className="liquid-glass-option"
              onClick={() => {
                setCategory("all");
                setOpen(false);
              }}
            >
              All categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={category === cat}
                className="liquid-glass-option"
                onClick={() => {
                  setCategory(cat);
                  setOpen(false);
                }}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type FilterFieldsProps = {
  city: string;
  category: string;
  setCategory: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  cities: CityOption[];
  categories: string[];
  onOpenCityModal: () => void;
  categoryMenuOpen: boolean;
  setCategoryMenuOpen: (v: boolean) => void;
  /** When true, stack fields vertically (drawer) */
  compact?: boolean;
  /** Hide search (drawer: search is pinned above on mobile) */
  showSearch?: boolean;
  /** Native category select in drawer (no overflow clip) */
  nativeCategory?: boolean;
};

function FilterFields({
  city,
  category,
  setCategory,
  date,
  setDate,
  search,
  setSearch,
  cities,
  categories,
  onOpenCityModal,
  categoryMenuOpen,
  setCategoryMenuOpen,
  compact,
  showSearch = true,
  nativeCategory = false,
}: FilterFieldsProps) {
  const cityLabel = !city
    ? "All cities"
    : (cities.find((c) => c.id === city)?.name ?? "All cities");

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        !compact && "lg:gap-6",
      )}
    >
      {showSearch ? (
        <div className="w-full min-w-0">
          <span className={labelCls}>Search</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meets by title, topic, or keyword…"
              className={searchInputClass}
              autoComplete="off"
              aria-label="Search meets"
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "grid min-w-0 gap-5",
          compact
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:items-end lg:gap-6",
        )}
      >
        <div className="relative min-w-0">
          <span className={labelCls}>City</span>
          <button
            type="button"
            className={cn(fieldBtn, "justify-between")}
            onClick={onOpenCityModal}
          >
            <span className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate text-left">{cityLabel}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
          </button>
        </div>

        <CategorySelect
          category={category}
          setCategory={setCategory}
          categories={categories}
          open={categoryMenuOpen}
          setOpen={setCategoryMenuOpen}
          native={nativeCategory}
        />

        <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
          <span className={labelCls}>Date</span>
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <input
              id="explore-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(
                "liquid-glass-field liquid-glass-field-sm w-full min-h-11 rounded-xl py-2.5 pl-10 pr-3 text-sm",
                "scheme-light dark:scheme-dark",
              )}
              aria-label="Filter by meet date"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExploreFilters({
  initialCity = "",
  initialCategory = "all",
  initialDate = "",
  initialSearch = "",
  cities,
  categories,
}: {
  initialCity?: string;
  initialCategory?: string;
  /** YYYY-MM-DD */
  initialDate?: string;
  initialSearch?: string;
  cities: CityOption[];
  categories: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [date, setDate] = useState(initialDate);
  const [search, setSearch] = useState(initialSearch);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useBodyLock(cityModalOpen || filterDrawerOpen);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCategoryMenuOpen(false);
        setCityModalOpen(false);
        setFilterDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const geoHintDone = useRef(false);

  /** IP-based city suggestion (only when URL had no city; runs once). */
  useEffect(() => {
    if (initialCity || geoHintDone.current) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/geo/hint");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          suggestedCityId: string | null;
          cityLabel: string | null;
        };
        geoHintDone.current = true;
        if (
          data.suggestedCityId &&
          cities.some((c) => c.id === data.suggestedCityId)
        ) {
          setCity(data.suggestedCityId);
          if (data.cityLabel) {
            toast.message(`Suggested city: ${data.cityLabel}`, {
              description: "Apply filters to search here, or pick another city.",
            });
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCity, cities]);

  const apply = useCallback(() => {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (category && category !== "all") p.set("category", category);
    if (date) p.set("date", date);
    if (search.trim()) p.set("search", search.trim());
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
    setCategoryMenuOpen(false);
    setFilterDrawerOpen(false);
  }, [router, pathname, city, category, date, search]);

  const activeFilterCount =
    (city ? 1 : 0) +
    (category && category !== "all" ? 1 : 0) +
    (date ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const filterFieldsProps: FilterFieldsProps = {
    city,
    category,
    setCategory,
    date,
    setDate,
    search,
    setSearch,
    cities,
    categories,
    onOpenCityModal: () => {
      setCityModalOpen(true);
      setCategoryMenuOpen(false);
    },
    categoryMenuOpen,
    setCategoryMenuOpen,
  };

  return (
    <>
      <CityPickerModal
        open={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        cities={cities}
        selectedId={city}
        onSelect={setCity}
      />

      {/* Mobile / tablet: search + filters trigger */}
      <div className="mt-10 lg:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply();
                }
              }}
              placeholder="Search meets…"
              className={searchInputClass}
              aria-label="Search meets"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterDrawerOpen(true);
              setCategoryMenuOpen(false);
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {filterDrawerOpen && (
          <div className="fixed inset-0 z-500 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
              aria-label="Close filters"
              onClick={() => setFilterDrawerOpen(false)}
            />
            <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-zinc-200/80 bg-background shadow-2xl dark:border-white/10">
              <div className="flex items-center justify-between border-b border-zinc-200/80 px-4 py-3 dark:border-white/10">
                <p className="font-onest text-base font-semibold">Filters</p>
                <button
                  type="button"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-primary"
                  onClick={() => setFilterDrawerOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <FilterFields
                  {...filterFieldsProps}
                  compact
                  showSearch={false}
                  nativeCategory
                />
              </div>
              <div className="border-t border-zinc-200/80 p-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={apply}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/92"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop filter card */}
      <div
        ref={toolbarRef}
        className="liquid-glass liquid-glass-toolbar mt-6 hidden border border-neutral-200 bg-white/95 shadow-[0_10px_26px_-16px_rgba(15,23,42,0.35)] lg:mt-10 lg:block"
        aria-label="Filter meets"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1">
            <FilterFields {...filterFieldsProps} />
          </div>
          <div className="flex shrink-0 flex-col justify-end border-t border-neutral-200 pt-5 lg:w-44 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <button
              type="button"
              onClick={apply}
              aria-label="Apply filters"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export type { CityOption } from "./filterTypes";
