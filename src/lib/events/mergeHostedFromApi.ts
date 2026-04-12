import { DEFAULT_MEET_EVENT_COVER_URL } from "@/lib/circle/mappers";
import type { MeetEvent } from "@/lib/types";

/** Wizard / local fallback Unsplash when no upload */
const WIZARD_COVER_SNIPPET = "photo-1519671482749";

/** Mapper fallback or empty API cover — not a user-uploaded URL */
export function isStockMeetCoverUrl(url: string | undefined | null): boolean {
  const u = (url ?? "").trim().toLowerCase();
  if (!u) return true;
  if (u.startsWith("data:")) return false;
  return (
    u === DEFAULT_MEET_EVENT_COVER_URL.toLowerCase() ||
    u.includes("photo-1540575467063") ||
    u.includes(WIZARD_COVER_SNIPPET)
  );
}

/**
 * When `GET /events/my` returns rows without `cover_image_url`, the mapper uses a stock
 * Unsplash URL — that would overwrite a meet published with an S3 (or other) cover in
 * the same session. Prefer the previous row’s image when the API row only has a stock URL
 * and we had a real URL before.
 */
export function mergeHostedEventPreservingLocalCover(
  previous: MeetEvent | undefined,
  fromApi: MeetEvent,
): MeetEvent {
  if (!previous) return fromApi;
  const prevImg = previous.image?.trim() ?? "";
  const apiImg = fromApi.image?.trim() ?? "";
  const apiWeak = isStockMeetCoverUrl(apiImg);
  const prevReal = prevImg.length > 0 && !isStockMeetCoverUrl(prevImg);
  const image = apiWeak && prevReal ? prevImg : fromApi.image;
  const additionalImages =
    fromApi.additionalImages?.length && fromApi.additionalImages.length > 0
      ? fromApi.additionalImages
      : previous.additionalImages?.length
        ? previous.additionalImages
        : fromApi.additionalImages;
  return {
    ...fromApi,
    image,
    additionalImages,
  };
}
