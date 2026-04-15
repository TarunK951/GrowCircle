import { circleRequest, circleRequestList } from "@/lib/circle/client";
import type {
  CircleRatingHostSummary,
  CircleRatingSubmitBody,
} from "@/lib/circle/types";

/** POST /ratings — guest rates host after event */
export function submitHostRating(
  accessToken: string,
  body: CircleRatingSubmitBody,
) {
  return circleRequest<unknown>("/ratings", {
    method: "POST",
    accessToken,
    body,
  });
}

/** GET /ratings/host/:hostId/summary — public */
export function getHostRatingSummary(hostId: string) {
  return circleRequest<CircleRatingHostSummary>(
    `/ratings/host/${encodeURIComponent(hostId)}/summary`,
    {},
  );
}

export type ListHostRatingsParams = { page?: number; limit?: number };

/** GET /ratings/host/:hostId — public list */
export function listHostRatings(
  hostId: string,
  params: ListHostRatingsParams = {},
) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<Record<string, unknown>>(
    `/ratings/host/${encodeURIComponent(hostId)}${q ? `?${q}` : ""}`,
    { accessToken: "" },
  );
}
