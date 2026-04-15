import { circleRequest } from "@/lib/circle/client";
import type { CircleNotificationPreferenceRow } from "@/lib/circle/types";

/** GET /notification-preferences */
export function getNotificationPreferences(accessToken: string) {
  return circleRequest<CircleNotificationPreferenceRow[]>(
    "/notification-preferences",
    { accessToken },
  );
}

/** PUT /notification-preferences */
export function updateNotificationPreferences(
  accessToken: string,
  body: {
    preferences: Partial<CircleNotificationPreferenceRow>[];
  },
) {
  return circleRequest<unknown>("/notification-preferences", {
    method: "PUT",
    accessToken,
    body,
  });
}
