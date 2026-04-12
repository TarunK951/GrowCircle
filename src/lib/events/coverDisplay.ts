import type { MeetEvent } from "@/lib/types";

const DEFAULT_MAPPER_COVER_SNIPPET = "photo-1540575467063";
const DEFAULT_WIZARD_COVER_SNIPPET = "photo-1519671482749";

export function isStockMeetCoverUrl(url: string | undefined | null): boolean {
  const normalized = (url ?? "").trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith("data:")) return false;
  return (
    normalized.includes(DEFAULT_MAPPER_COVER_SNIPPET) ||
    normalized.includes(DEFAULT_WIZARD_COVER_SNIPPET)
  );
}

export function meetEventGalleryUrls(event: MeetEvent): string[] {
  const candidates = [event.image, ...(event.additionalImages ?? [])]
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && !isStockMeetCoverUrl(url));

  return Array.from(new Set(candidates));
}

export function primaryMeetImage(event: MeetEvent): string | null {
  return meetEventGalleryUrls(event)[0] ?? null;
}
