import { createListenerMiddleware } from "@reduxjs/toolkit";
import { applyTokenRefresh } from "@/lib/store/authSlice";
import { circleApi } from "@/lib/store/circleApi";

/**
 * After silent token rotation, RTK Query can still show stale errors from failed requests.
 * Invalidate Circle-tagged queries so active subscribers refetch with the new JWT.
 */
export const circleAuthListenerMiddleware = createListenerMiddleware();

circleAuthListenerMiddleware.startListening({
  actionCreator: applyTokenRefresh,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(
      circleApi.util.invalidateTags([
        { type: "PublicEvents", id: "LIST" },
        { type: "HostedEvents", id: "LIST" },
        { type: "MyApplications", id: "LIST" },
        { type: "Notifications", id: "LIST" },
        { type: "UnreadCount", id: "COUNT" },
      ]),
    );
  },
});
