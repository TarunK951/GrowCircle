"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
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

  const { data, isError } = useListPublicEventsQuery(
    { page: 1, limit: 100 },
    { skip: !isCircleApiConfigured() },
  );

  const wasCatalogError = useRef(false);

  useEffect(() => {
    if (!isCircleApiConfigured()) return;
    if (isError && !wasCatalogError.current) {
      wasCatalogError.current = true;
      toast.error(
        "Could not load published events from Circle (e.g. API 500). Explore may miss remote listings until the server responds.",
        { id: "circle-catalog-list-error", duration: 10_000 },
      );
    }
    if (!isError) wasCatalogError.current = false;
  }, [isError]);

  useEffect(() => {
    if (!isCircleApiConfigured() || data === undefined) return;
    setCircleCatalogEvents(data);
  }, [data, setCircleCatalogEvents]);

  return null;
}
