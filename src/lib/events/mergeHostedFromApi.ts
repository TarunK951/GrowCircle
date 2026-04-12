import type { MeetEvent } from "@/lib/types";
import { isStockMeetCoverUrl } from "@/lib/events/coverDisplay";

/**
 * Prefer previous local cover when the fresh API row has no real cover URL.
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
