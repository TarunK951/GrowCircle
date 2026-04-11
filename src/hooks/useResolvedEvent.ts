"use client";

import { useEffect, useMemo, useState } from "react";
import { getEventById } from "@/lib/circle/api";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { circleEventToMeetEvent } from "@/lib/circle/mappers";
import { getEventFromCatalog } from "@/lib/eventsCatalog";
import { useSessionStore } from "@/stores/session-store";
import type { MeetEvent } from "@/lib/types";

type RemoteState =
  | { id: string; value: MeetEvent | null }
  | undefined;

/**
 * Resolves an event from the local catalog (seed + Circle + hosted), or fetches
 * by id from the Circle API when configured.
 */
export function useResolvedEvent(id: string): {
  event: MeetEvent | null;
  loading: boolean;
} {
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const accessToken = useSessionStore((s) => s.accessToken);
  const upsertCircleCatalogEvent = useSessionStore(
    (s) => s.upsertCircleCatalogEvent,
  );

  const fromCatalog = useMemo(
    () => getEventFromCatalog(id, hostedEvents, circleCatalogEvents),
    [id, hostedEvents, circleCatalogEvents],
  );

  const [remote, setRemote] = useState<RemoteState>(undefined);

  useEffect(() => {
    if (fromCatalog) {
      return;
    }
    if (!isCircleApiConfigured()) {
      return;
    }

    let cancelled = false;

    void getEventById(id, accessToken)
      .then((raw) => {
        if (cancelled) return;
        const ev = circleEventToMeetEvent(raw);
        upsertCircleCatalogEvent(ev);
        setRemote({ id, value: ev });
      })
      .catch(() => {
        if (!cancelled) setRemote({ id, value: null });
      });

    return () => {
      cancelled = true;
    };
  }, [id, fromCatalog, accessToken, upsertCircleCatalogEvent]);

  const remoteForId =
    remote && remote.id === id ? remote.value : undefined;

  const event =
    fromCatalog ?? (isCircleApiConfigured() ? remoteForId ?? null : null);

  const loading =
    !fromCatalog &&
    isCircleApiConfigured() &&
    remoteForId === undefined;

  return { event, loading };
}
