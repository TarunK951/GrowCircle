import type { MeetEvent } from "@/lib/types";

/** Primary category list for filters and host UI (matches legacy wizard options). */
export const EVENT_CATEGORY_PRESETS = [
  "Social",
  "Professional",
  "Culture",
  "Wellness",
  "Games",
] as const;

export type EventCategoryPreset = (typeof EVENT_CATEGORY_PRESETS)[number];

/** Up to 3 labels for display; falls back to legacy `category`. */
export function eventCategoryLabels(event: MeetEvent): string[] {
  if (event.categories?.length) {
    return event.categories.slice(0, 3);
  }
  return [event.category];
}

/** Eyebrow line: "A · B · C" (no city). */
export function formatCategoryEyebrow(event: MeetEvent): string {
  return eventCategoryLabels(event).join(" · ");
}

export function eventMatchesCategoryFilter(
  event: MeetEvent,
  filter: string,
): boolean {
  if (filter === "all" || !filter) return true;
  if (event.categories?.length) {
    return event.categories.includes(filter);
  }
  return event.category === filter;
}
