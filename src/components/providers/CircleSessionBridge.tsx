"use client";

import { useEffect, useRef } from "react";
import {
  configureCircleSession,
  getAccessTokenExpiryMs,
  refreshCircleAccessToken,
} from "@/lib/circle/sessionBridge";
import { isCircleApiConfigured } from "@/lib/circle/config";
import {
  applyTokenRefresh,
  selectAccessToken,
  selectRefreshToken,
  selectUser,
} from "@/lib/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { store } from "@/lib/store/store";
import { useSessionStore } from "@/stores/session-store";

/** When JWT has no/invalid exp, still rotate refresh token on this cadence. */
const FALLBACK_INTERVAL_MS = 10 * 60 * 1000;

/** Refresh this long before access token expiry (API §1.4). */
const REFRESH_BEFORE_EXPIRY_MS = 2 * 60 * 1000;

/** Avoid hammering /auth/refresh-token when switching tabs. */
const VISIBILITY_THROTTLE_MS = 45 * 1000;

/**
 * Wires refresh-token rotation into Redux auth and keeps access tokens fresh:
 * — timer ~2 min before JWT exp (when `exp` is present)
 * — fallback interval when `exp` is missing
 * — refresh when the tab becomes visible again
 */
export function CircleSessionBridge() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const lastVisibilityRefreshRef = useRef(0);
  /** One-shot refresh when JWT has no `exp` (opaque token) — avoids a refresh loop. */
  const opaqueTokenWarmupRef = useRef(false);

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
    if (!isCircleApiConfigured() || !user || !refreshToken) return;

    const id = window.setInterval(() => {
      void refreshCircleAccessToken();
    }, FALLBACK_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [user, refreshToken]);

  useEffect(() => {
    if (!isCircleApiConfigured() || !user || !refreshToken || !accessToken) {
      opaqueTokenWarmupRef.current = false;
      return;
    }

    const expMs = getAccessTokenExpiryMs(accessToken);
    /** Opaque or non-JWT access tokens: rotate once per session so API calls don’t 401 first. */
    if (expMs == null) {
      if (!opaqueTokenWarmupRef.current) {
        opaqueTokenWarmupRef.current = true;
        void refreshCircleAccessToken();
      }
      return;
    }

    opaqueTokenWarmupRef.current = false;

    let cancelled = false;
    const msUntil = expMs - Date.now() - REFRESH_BEFORE_EXPIRY_MS;

    if (msUntil <= 0) {
      void refreshCircleAccessToken();
      return;
    }

    const delay = Math.max(
      15_000,
      Math.min(msUntil, 24 * 60 * 60 * 1000),
    );

    const timer = window.setTimeout(() => {
      if (!cancelled) void refreshCircleAccessToken();
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [user, refreshToken, accessToken]);

  useEffect(() => {
    if (!isCircleApiConfigured() || !user || !refreshToken) return;

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastVisibilityRefreshRef.current < VISIBILITY_THROTTLE_MS) {
        return;
      }
      lastVisibilityRefreshRef.current = now;
      void refreshCircleAccessToken();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user, refreshToken]);

  return null;
}
