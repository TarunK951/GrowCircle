"use client";

import { useEffect } from "react";
import { getMyHostedEvents } from "@/lib/circle/api";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { circleEventToMeetEvent } from "@/lib/circle/mappers";
import { useSessionStore } from "@/stores/session-store";

/**
 * Keeps `hostedEvents` aligned with `GET /events/my` when the user is signed in
 * with Circle tokens.
 */
export function CircleHostedEventsSync() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const syncHostedEventsFromApi = useSessionStore(
    (s) => s.syncHostedEventsFromApi,
  );

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const rows = await getMyHostedEvents(accessToken);
        if (cancelled) return;
        syncHostedEventsFromApi(rows.map(circleEventToMeetEvent));
      } catch (e) {
        if (e instanceof CircleApiError && e.status === 401) return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, syncHostedEventsFromApi]);

  return null;
}
