"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CityOption = { id: string; name: string };

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

  return (
    <div
      ref={toolbarRef}
      className="liquid-glass liquid-glass-toolbar mt-8"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-secondary">
            City
          </span>
          <button
            type="button"
            id="explore-filter-city"
            aria-haspopup="listbox"
            aria-expanded={open === "city"}
            className={cn(
              "liquid-glass-field",
              open === "city" && "liquid-glass-field-open",
            )}
            onClick={() =>
              setOpen((o) => (o === "city" ? null : "city"))
            }
          >
            <span className="truncate text-left">{cityLabel}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                open === "city" && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {open === "city" && (
            <ul
              className="liquid-glass-menu absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto p-1.5"
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

        <div className="relative">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-secondary">
            Category
          </span>
          <button
            type="button"
            id="explore-filter-category"
            aria-haspopup="listbox"
            aria-expanded={open === "category"}
            className={cn(
              "liquid-glass-field",
              open === "category" && "liquid-glass-field-open",
            )}
            onClick={() =>
              setOpen((o) => (o === "category" ? null : "category"))
            }
          >
            <span className="truncate text-left">{categoryLabel}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                open === "category" && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {open === "category" && (
            <ul
              className="liquid-glass-menu absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto p-1.5"
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

        <div>
          <label
            htmlFor="explore-date-from"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-secondary"
          >
            From
          </label>
          <div className="liquid-glass-date">
            <input
              id="explore-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="explore-date-to"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-secondary"
          >
            To
          </label>
          <div className="liquid-glass-date">
            <input
              id="explore-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={apply}
          className="inline-flex min-h-11 min-w-[7.5rem] items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary/92 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:scale-[0.98]"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
