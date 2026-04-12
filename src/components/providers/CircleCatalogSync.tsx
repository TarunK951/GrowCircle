"use client";

import { useEffect } from "react";
import { listPublicEvents } from "@/lib/circle/api";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { circleEventToMeetEvent } from "@/lib/circle/mappers";
import { useSessionStore } from "@/stores/session-store";

/**
 * Loads published events from the Circle API when configured, into session for
 * explore / home / detail resolution.
 */
export function CircleCatalogSync() {
  const setCircleCatalogEvents = useSessionStore(
    (s) => s.setCircleCatalogEvents,
  );

  useEffect(() => {
    if (!isCircleApiConfigured()) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await listPublicEvents({
          status: "published",
          limit: 100,
          page: 1,
        });
        if (cancelled) return;
        setCircleCatalogEvents(data.map(circleEventToMeetEvent));
      } catch {
        /* keep local seed catalog */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setCircleCatalogEvents]);

  return null;
}
