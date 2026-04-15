import { circleRequest, circleRequestList } from "@/lib/circle/client";
import type {
  CircleEvent,
  CircleToggleSavedData,
} from "@/lib/circle/types";

export type ListSavedEventsParams = {
  page?: number;
  limit?: number;
};

/** GET /saved-events — list + meta; items may be full events or minimal `{ id }`. */
export function listSavedEvents(
  accessToken: string,
  params: ListSavedEventsParams = {},
) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CircleEvent>(
    q ? `/saved-events?${q}` : "/saved-events",
    { accessToken },
  );
}

/** POST /saved-events/:eventId — toggle save on server. */
export function toggleSavedEvent(
  accessToken: string,
  eventId: string,
) {
  return circleRequest<CircleToggleSavedData>(
    `/saved-events/${encodeURIComponent(eventId)}`,
    { method: "POST", accessToken },
  );
}
