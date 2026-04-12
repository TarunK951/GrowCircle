"use client";

import { useEffect } from "react";
import {
  configureCircleSession,
  refreshCircleAccessToken,
} from "@/lib/circle/sessionBridge";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { applyTokenRefresh, selectAccessToken } from "@/lib/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { store } from "@/lib/store/store";
import { useSessionStore } from "@/stores/session-store";

const REFRESH_INTERVAL_MS = 20 * 60 * 1000;

/**
 * Wires refresh-token rotation into Redux auth and periodically refreshes
 * access tokens while the user is signed in with Circle.
 */
export function CircleSessionBridge() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);

  useEffect(() => {
    configureCircleSession({
      getSession: () => {
        const s = store.getState();
        return { user: s.auth.user, refreshToken: s.auth.refreshToken };
      },
      applyTokens: (t) => {
        dispatch(applyTokenRefresh(t));
      },
      onRefreshFailed: () => useSessionStore.getState().logout(),
    });
  }, [dispatch]);

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken) return;
    const id = window.setInterval(() => {
      void refreshCircleAccessToken();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [accessToken]);

  return null;
}
