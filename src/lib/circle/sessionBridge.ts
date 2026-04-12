import { refreshTokens } from "@/lib/circle/api";
import { applyTokenRefresh } from "@/lib/store/authSlice";
import type { User } from "@/lib/types";
import { store } from "@/lib/store/store";

type Tokens = { accessToken: string; refreshToken: string };

type SessionBridge = {
  getSession: () => { user: User | null; refreshToken: string | null };
  applyTokens: (t: Tokens) => void;
  onRefreshFailed?: () => void;
};

let bridge: SessionBridge | null = null;

/** Coalesces overlapping refresh calls (timers + tab focus + API retries). */
let refreshInFlight: Promise<boolean> | null = null;

/** When JWT `exp` is known, refresh this long before expiry (matches `CircleSessionBridge`). */
const ENSURE_REFRESH_BEFORE_MS = 2 * 60 * 1000;

export function configureCircleSession(next: SessionBridge): void {
  bridge = next;
}

/**
 * Default bridge must exist before any Circle API call (e.g. RTK `hostedEvents` in
 * `AppProviders`). `CircleSessionBridge` only mounts under `(app)/layout`, so marketing
 * routes (e.g. host wizard) would otherwise run with `bridge === null` and never refresh.
 */
function registerDefaultCircleSessionBridge(): void {
  configureCircleSession({
    getSession: () => {
      const s = store.getState();
      return { user: s.auth.user, refreshToken: s.auth.refreshToken };
    },
    applyTokens: (t) => {
      store.dispatch(applyTokenRefresh(t));
    },
    onRefreshFailed: () => {
      if (typeof window === "undefined") return;
      void import("@/stores/session-store").then(({ useSessionStore }) => {
        useSessionStore.getState().logout();
      });
    },
  });
}

registerDefaultCircleSessionBridge();

/** Returns JWT `exp` as ms since epoch, or null if not a decodable JWT. */
export function getAccessTokenExpiryMs(accessToken: string): number | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const payload = JSON.parse(atob(b64)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Uses refresh token to obtain new access/refresh pair and updates the session.
 * Returns true on success. On failure, calls `onRefreshFailed` if configured.
 * Concurrent callers share one in-flight request.
 */
export async function refreshCircleAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    if (!bridge) return false;
    const { user, refreshToken } = bridge.getSession();
    if (!user || !refreshToken) return false;
    try {
      const nextTokens = await refreshTokens(refreshToken);
      bridge.applyTokens({
        accessToken: nextTokens.accessToken,
        refreshToken: nextTokens.refreshToken,
      });
      return true;
    } catch {
      bridge.onRefreshFailed?.();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * Returns a usable access token from Redux. Refreshes when the access token is missing,
 * when the JWT is expired or within ~2 minutes of expiring,
 * or when only a refresh token exists. Non-JWT (opaque) tokens are returned as-is; rotation
 * relies on timers, tab focus, and `circleRequest` 401 retry.
 */
export async function ensureCircleAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = store.getState().auth;

  if (!refreshToken) {
    return accessToken ?? null;
  }

  if (!accessToken) {
    const ok = await refreshCircleAccessToken();
    return ok ? store.getState().auth.accessToken : null;
  }

  const expMs = getAccessTokenExpiryMs(accessToken);
  if (expMs == null) {
    return accessToken;
  }

  const now = Date.now();
  if (expMs <= now) {
    const ok = await refreshCircleAccessToken();
    return ok ? store.getState().auth.accessToken : null;
  }

  if (expMs <= now + ENSURE_REFRESH_BEFORE_MS) {
    const ok = await refreshCircleAccessToken();
    if (ok) return store.getState().auth.accessToken ?? null;
  }

  return accessToken;
}
