import { eventMatchesCategoryFilter } from "@/lib/eventCategories";
import type { MeetEvent } from "@/lib/types";

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
  if (filters?.cityId) list = list.filter((e) => e.cityId === filters.cityId);
  if (filters?.category && filters.category !== "all") {
    list = list.filter((e) =>
      eventMatchesCategoryFilter(e, filters.category!),
    );
  }
  if (filters?.dateFrom) {
    const from = new Date(filters.dateFrom + "T00:00:00");
    list = list.filter((e) => new Date(e.startsAt) >= from);
  }
  if (filters?.dateTo) {
    const to = new Date(filters.dateTo + "T23:59:59.999");
    list = list.filter((e) => new Date(e.startsAt) <= to);
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
