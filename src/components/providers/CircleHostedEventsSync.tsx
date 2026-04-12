"use client";

import { useEffect } from "react";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { useHostedEventsQuery } from "@/lib/store/circleApi";
import { selectAccessToken } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";

/**
 * Keeps `hostedEvents` aligned with `GET /events/my` when the user is signed in
 * with Circle tokens (RTK Query + zustand bridge).
 */
export function CircleHostedEventsSync() {
  const accessToken = useAppSelector(selectAccessToken);
  const syncHostedEventsFromApi = useSessionStore(
    (s) => s.syncHostedEventsFromApi,
  );

  const { data } = useHostedEventsQuery(undefined, {
    skip: !isCircleApiConfigured() || !accessToken,
  });

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken) return;
    if (data === undefined) return;
    syncHostedEventsFromApi(data);
  }, [accessToken, data, syncHostedEventsFromApi]);

  return null;
}
