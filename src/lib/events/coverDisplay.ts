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

export type MeetEventGalleryUrlOpts = {
  /**
   * When true, keep default Unsplash placeholders in the list (host preview / editing).
   * Public listings omit them so placeholder art is not shown as the meet photo.
   */
  includeStockPlaceholders?: boolean;
};

export function meetEventGalleryUrls(
  event: MeetEvent,
  opts?: MeetEventGalleryUrlOpts,
): string[] {
  const stripStock = !opts?.includeStockPlaceholders;
  const candidates = [event.image, ...(event.additionalImages ?? [])]
    .map((url) => url.trim())
    .filter(
      (url) =>
        url.length > 0 &&
        (!stripStock || !isStockMeetCoverUrl(url)),
    );

  return Array.from(new Set(candidates));
}

export function primaryMeetImage(event: MeetEvent): string | null {
  return meetEventGalleryUrls(event)[0] ?? null;
}
