"use client";

import { useEffect, useMemo, useState } from "react";
import { getEventById } from "@/lib/circle/api";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { circleEventToMeetEvent } from "@/lib/circle/mappers";
import { getEventFromCatalog } from "@/lib/eventsCatalog";
import { mergeRemoteDetailWithCatalog } from "@/lib/meetMerge";
import { selectAccessToken } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import type { MeetEvent } from "@/lib/types";

/**
 * Remote fetch: `undefined` = in flight or skipped, `null` = error, `MeetEvent` = success.
 * Always GET `/events/:id` when the API is configured so detail is not stuck on list-only
 * rows (subset fields) from `CircleCatalogSync`.
 */
type RemoteDetail = MeetEvent | null | undefined;

/**
 * Resolves an event from the catalog (Circle + hosted), and refreshes from
 * `GET /events/:id` when the Circle API is configured.
 */
export function useResolvedEvent(id: string): {
  event: MeetEvent | null;
  loading: boolean;
} {
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const accessToken = useAppSelector(selectAccessToken);
  const upsertCircleCatalogEvent = useSessionStore(
    (s) => s.upsertCircleCatalogEvent,
  );

  const fromCatalog = useMemo(
    () => getEventFromCatalog(id, hostedEvents, circleCatalogEvents),
    [id, hostedEvents, circleCatalogEvents],
  );

  const [remoteDetail, setRemoteDetail] = useState<RemoteDetail>(undefined);

  useEffect(() => {
    if (!isCircleApiConfigured()) {
      setRemoteDetail(null);
      return;
    }

    let cancelled = false;
    setRemoteDetail(undefined);

    void getEventById(id, accessToken)
      .then((raw) => {
        if (cancelled) return;
        const ev = circleEventToMeetEvent(raw);
        upsertCircleCatalogEvent(ev);
        setRemoteDetail(ev);
      })
      .catch(() => {
        if (!cancelled) setRemoteDetail(null);
      });

    return () => {
      cancelled = true;
    };
  }, [id, accessToken, upsertCircleCatalogEvent]);

  const event: MeetEvent | null =
    remoteDetail !== undefined && remoteDetail !== null
      ? mergeRemoteDetailWithCatalog(remoteDetail, fromCatalog)
      : fromCatalog ?? null;

  const loading =
    isCircleApiConfigured() &&
    remoteDetail === undefined &&
    !fromCatalog;

  return { event, loading };
}
