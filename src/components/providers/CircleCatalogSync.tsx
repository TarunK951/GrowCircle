"use client";

import { useEffect } from "react";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { useListPublicEventsQuery } from "@/lib/store/circleApi";
import { useSessionStore } from "@/stores/session-store";

/**
 * Loads published events from the Circle API when configured, into session for
 * explore / home / detail resolution (via RTK Query + zustand bridge).
 */
export function CircleCatalogSync() {
  const setCircleCatalogEvents = useSessionStore(
    (s) => s.setCircleCatalogEvents,
  );

  const { data } = useListPublicEventsQuery(
    { page: 1, limit: 100 },
    { skip: !isCircleApiConfigured() },
  );

  useEffect(() => {
    if (!isCircleApiConfigured() || data === undefined) return;
    setCircleCatalogEvents(data);
  }, [data, setCircleCatalogEvents]);

  return null;
}
