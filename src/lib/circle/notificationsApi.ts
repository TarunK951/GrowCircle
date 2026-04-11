import { circleRequest, circleRequestList } from "@/lib/circle/client";
import type {
  CircleApiNotification,
  CircleUnreadCountData,
} from "@/lib/circle/types";

export type ListNotificationsParams = {
  page?: number;
  limit?: number;
};

/** §11.1 */
export function listNotifications(
  accessToken: string,
  params: ListNotificationsParams = {},
) {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  const path = qs ? `/notifications?${qs}` : "/notifications";
  return circleRequestList<CircleApiNotification>(path, { accessToken });
}

/** §11.2 */
export function getUnreadNotificationCount(accessToken: string) {
  return circleRequest<CircleUnreadCountData>("/notifications/unread-count", {
    accessToken,
  });
}

/** §11.3 */
export function markAllNotificationsRead(accessToken: string) {
  return circleRequest<unknown>("/notifications/read-all", {
    method: "PUT",
    accessToken,
  });
}

/** §11.4 */
export function markNotificationRead(accessToken: string, id: string) {
  return circleRequest<CircleApiNotification>(
    `/notifications/${encodeURIComponent(id)}/read`,
    { method: "PUT", accessToken },
  );
}
