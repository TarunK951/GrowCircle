import type { MeetEvent } from "@/lib/types";
import eventsData from "@/data/events.json";

const staticList = eventsData as MeetEvent[];

export function getStaticEvents(): MeetEvent[] {
  return staticList;
}

/** Merge seed events with user-published meets (by id: hosted wins for same id — should not happen). */
export function mergeEventCatalog(
  hosted: MeetEvent[],
): MeetEvent[] {
  const byId = new Map<string, MeetEvent>();
  for (const e of staticList) {
    byId.set(e.id, { ...e });
  }
  for (const h of hosted) {
    byId.set(h.id, { ...h });
  }
  return [...byId.values()];
}

export function getEventFromCatalog(
  id: string,
  hosted: MeetEvent[],
): MeetEvent | null {
  const merged = mergeEventCatalog(hosted);
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
): MeetEvent[] {
  let list = mergeEventCatalog(hosted);
  if (filters?.publicOnly) {
    list = list.filter((e) => (e.listingVisibility ?? "public") === "public");
  }
  if (filters?.cityId) list = list.filter((e) => e.cityId === filters.cityId);
  if (filters?.category && filters.category !== "all")
    list = list.filter((e) => e.category === filters.category);
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

export function generateAttendanceCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateShareToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
