import {
  eventCategoryLabels,
  eventMatchesCategoryFilter,
} from "@/lib/eventCategories";
import type { City, MeetEvent } from "@/lib/types";
import citiesData from "@/data/cities.json";

const cities = citiesData as City[];

function eventMatchesCityFilter(event: MeetEvent, cityId: string): boolean {
  if (event.cityId === cityId) return true;
  const loc = event.displayLocation?.trim().toLowerCase();
  if (!loc) return cityId === "circle";
  const selected = cities.find((c) => c.id === cityId);
  if (!selected) return false;
  if (selected.id === "circle") return true;
  return loc.includes(selected.name.toLowerCase());
}

export type CatalogMergeOptions = {
  /** @deprecated Static JSON seed removed; option ignored. */
  includeStaticSeed?: boolean;
};

/** Merge Circle API rows and user-published meets (hosted wins on id clash). */
export function mergeEventCatalog(
  hosted: MeetEvent[],
  remoteRows: MeetEvent[] = [],
  _options?: CatalogMergeOptions,
): MeetEvent[] {
  const byId = new Map<string, MeetEvent>();
  for (const r of remoteRows) {
    byId.set(r.id, { ...r });
  }
  for (const h of hosted) {
    byId.set(h.id, { ...h });
  }
  return [...byId.values()];
}

export function getEventFromCatalog(
  id: string,
  hosted: MeetEvent[],
  remoteRows: MeetEvent[] = [],
  options?: CatalogMergeOptions,
): MeetEvent | null {
  const merged = mergeEventCatalog(hosted, remoteRows, options);
  return merged.find((e) => e.id === id) ?? null;
}

export function listEventsMerged(
  hosted: MeetEvent[],
  filters?: {
    cityId?: string;
    category?: string;
    /** YYYY-MM-DD — events whose start falls on that calendar day (local). */
    date?: string;
    /** Case-insensitive match on title, description, or category labels. */
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    /** When true, only events visible on explore. */
    publicOnly?: boolean;
  },
  remoteRows: MeetEvent[] = [],
  catalogOptions?: CatalogMergeOptions,
): MeetEvent[] {
  let list = mergeEventCatalog(hosted, remoteRows, catalogOptions);
  list = list.filter((e) => !e.cancelledAt);
  if (filters?.publicOnly) {
    list = list.filter((e) => (e.listingVisibility ?? "public") === "public");
  }
  if (filters?.cityId) {
    list = list.filter((e) => eventMatchesCityFilter(e, filters.cityId!));
  }
  if (filters?.category && filters.category !== "all") {
    list = list.filter((e) =>
      eventMatchesCategoryFilter(e, filters.category!),
    );
  }
  if (filters?.date) {
    const d = filters.date;
    const start = new Date(`${d}T00:00:00`);
    const end = new Date(`${d}T23:59:59.999`);
    list = list.filter((e) => {
      const t = new Date(e.startsAt);
      return t >= start && t <= end;
    });
  } else {
    if (filters?.dateFrom) {
      const from = new Date(filters.dateFrom + "T00:00:00");
      list = list.filter((e) => new Date(e.startsAt) >= from);
    }
    if (filters?.dateTo) {
      const to = new Date(filters.dateTo + "T23:59:59.999");
      list = list.filter((e) => new Date(e.startsAt) <= to);
    }
  }
  const q = filters?.search?.trim().toLowerCase();
  if (q) {
    list = list.filter((e) => {
      if (e.title.toLowerCase().includes(q)) return true;
      if (e.description.toLowerCase().includes(q)) return true;
      return eventCategoryLabels(e).some((c) => c.toLowerCase().includes(q));
    });
  }
  return list;
}

/** Past start time, or host-cancelled — for Saved / card styling. */
export function isMeetInactive(event: MeetEvent, now = new Date()): boolean {
  if (event.cancelledAt) return true;
  return new Date(event.startsAt) < now;
}

export function generateAttendanceCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateShareToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
