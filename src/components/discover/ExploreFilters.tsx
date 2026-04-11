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
    "mb-0.5 block text-[0.6rem] font-semibold uppercase tracking-wider text-secondary sm:text-[0.65rem]";

  return (
    <div
      ref={toolbarRef}
      className="liquid-glass liquid-glass-toolbar mt-8 !p-3 sm:!p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end md:gap-x-3 md:gap-y-0">
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
                "h-3 w-3 shrink-0 text-muted/90 transition-transform duration-200 sm:h-3.5 sm:w-3.5",
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
                "h-3 w-3 shrink-0 text-muted/90 transition-transform duration-200 sm:h-3.5 sm:w-3.5",
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

        <div className="min-w-0 sm:col-span-2 md:col-span-1">
          <span className={labelCls}>Dates</span>
          <div className="explore-filters-strip liquid-glass-date-compact w-full max-w-full md:max-w-none">
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
              className="shrink-0 px-0.5 text-[0.65rem] font-medium tabular-nums text-muted/75 sm:px-1 sm:text-[0.7rem]"
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

        <div className="flex min-w-0 flex-col gap-1 sm:col-span-2 md:col-span-1 md:min-w-[4.75rem]">
          <span
            className={cn(
              labelCls,
              "hidden select-none md:mb-0.5 md:block md:invisible",
            )}
            aria-hidden
          >
            Apply
          </span>
          <button
            type="button"
            onClick={apply}
            aria-label="Apply filters"
            className="inline-flex min-h-8 w-full shrink-0 items-center justify-center rounded-full bg-primary px-3 py-1.5 text-[0.6875rem] font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98] sm:min-h-[2rem] sm:px-3.5 sm:text-xs md:w-auto md:self-stretch"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
