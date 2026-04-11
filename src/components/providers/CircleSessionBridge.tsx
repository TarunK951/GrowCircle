"use client";

import { useEffect } from "react";
import {
  configureCircleSession,
  refreshCircleAccessToken,
} from "@/lib/circle/sessionBridge";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { useSessionStore } from "@/stores/session-store";

const REFRESH_INTERVAL_MS = 20 * 60 * 1000;

/**
 * Wires refresh-token rotation into the session store and periodically refreshes
 * access tokens while the user is signed in with Circle.
 */
export function CircleSessionBridge() {
  const accessToken = useSessionStore((s) => s.accessToken);

  useEffect(() => {
    configureCircleSession({
      getSession: () => {
        const s = useSessionStore.getState();
        return { user: s.user, refreshToken: s.refreshToken };
      },
      applyTokens: (t) => {
        const s = useSessionStore.getState();
        if (s.user) {
          s.loginWithCircle(s.user, t);
        }
      },
      onRefreshFailed: () => useSessionStore.getState().logout(),
    });
  }, []);

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken) return;
    const id = window.setInterval(() => {
      void refreshCircleAccessToken();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [accessToken]);

  return null;
}
