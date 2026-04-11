"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CityOption = { id: string; name: string };

const fieldBtn = "liquid-glass-field liquid-glass-field-sm";

export function ExploreFilters({
  initialCity = "",
  initialCategory = "all",
  initialDateFrom = "",
  initialDateTo = "",
  cities,
  categories,
}: {
  initialCity?: string;
  initialCategory?: string;
  initialDateFrom?: string;
  initialDateTo?: string;
  cities: CityOption[];
  categories: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [open, setOpen] = useState<"city" | "category" | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!toolbarRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const apply = useCallback(() => {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    if (category && category !== "all") p.set("category", category);
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo) p.set("dateTo", dateTo);
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
    setOpen(null);
  }, [router, pathname, city, category, dateFrom, dateTo]);

  const cityLabel = !city
    ? "All cities"
    : (cities.find((c) => c.id === city)?.name ?? "All cities");

  const categoryLabel =
    !category || category === "all" ? "All" : category;

  const labelCls =
    "mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-800 dark:text-zinc-200";

  return (
    <div
      ref={toolbarRef}
      className="liquid-glass liquid-glass-toolbar mt-10"
      aria-label="Filter meets"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <div className="relative min-w-0">
          <span className={labelCls}>City</span>
          <button
            type="button"
            id="explore-filter-city"
            aria-haspopup="listbox"
            aria-expanded={open === "city"}
            className={cn(
              fieldBtn,
              "w-full",
              open === "city" && "liquid-glass-field-open",
            )}
            onClick={() =>
              setOpen((o) => (o === "city" ? null : "city"))
            }
          >
            <span className="truncate text-left">{cityLabel}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200 sm:h-4 sm:w-4",
                open === "city" && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {open === "city" && (
            <ul
              className="liquid-glass-menu absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto p-1.5 text-sm"
              role="listbox"
              aria-labelledby="explore-filter-city"
            >
              <li role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={city === ""}
                  className="liquid-glass-option"
                  onClick={() => {
                    setCity("");
                    setOpen(null);
                  }}
                >
                  All cities
                </button>
              </li>
              {cities.map((c) => (
                <li key={c.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={city === c.id}
                    className="liquid-glass-option"
                    onClick={() => {
                      setCity(c.id);
                      setOpen(null);
                    }}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          </div>

          <div className="relative min-w-0">
          <span className={labelCls}>Category</span>
          <button
            type="button"
            id="explore-filter-category"
            aria-haspopup="listbox"
            aria-expanded={open === "category"}
            className={cn(
              fieldBtn,
              "w-full",
              open === "category" && "liquid-glass-field-open",
            )}
            onClick={() =>
              setOpen((o) => (o === "category" ? null : "category"))
            }
          >
            <span className="truncate text-left">{categoryLabel}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200 sm:h-4 sm:w-4",
                open === "category" && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {open === "category" && (
            <ul
              className="liquid-glass-menu absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto p-1.5 text-sm"
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
                    setOpen(null);
                  }}
                >
                  All
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
                      setOpen(null);
                    }}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          )}
          </div>

          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <span className={labelCls}>Dates</span>
          <div className="explore-filters-strip liquid-glass-date-compact w-full max-w-full">
            <div className="min-w-0 flex-1">
              <input
                ref={dateFromRef}
                id="explore-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Start date"
                className="w-full"
              />
            </div>
            <span
              className="shrink-0 px-1 text-xs font-medium tabular-nums text-zinc-400 sm:px-1.5"
              aria-hidden
            >
              –
            </span>
            <div className="min-w-0 flex-1">
              <input
                ref={dateToRef}
                id="explore-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="End date"
                className="w-full"
              />
            </div>
          </div>
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 flex-col justify-end border-t border-zinc-200/80 pt-5 dark:border-white/10 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <button
            type="button"
            onClick={apply}
            aria-label="Apply filters"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/92 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98] lg:min-w-30"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
