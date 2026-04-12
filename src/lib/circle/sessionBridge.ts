import { refreshTokens } from "@/lib/circle/api";
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

export function configureCircleSession(next: SessionBridge): void {
  bridge = next;
}

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
 * Returns a valid access token from Redux, refreshing with the stored refresh token
 * when the access token is missing (e.g. expired) but the session is still valid.
 */
export async function ensureCircleAccessToken(): Promise<string | null> {
  const access = store.getState().auth.accessToken;
  if (access) return access;
  const ok = await refreshCircleAccessToken();
  return ok ? store.getState().auth.accessToken : null;
}
