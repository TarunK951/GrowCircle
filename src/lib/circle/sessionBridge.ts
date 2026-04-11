import { refreshTokens } from "@/lib/circle/api";
import type { User } from "@/lib/types";

type Tokens = { accessToken: string; refreshToken: string };

type SessionBridge = {
  getSession: () => { user: User | null; refreshToken: string | null };
  applyTokens: (t: Tokens) => void;
  onRefreshFailed?: () => void;
};

let bridge: SessionBridge | null = null;

export function configureCircleSession(next: SessionBridge): void {
  bridge = next;
}

/**
 * Uses refresh token to obtain new access/refresh pair and updates the session.
 * Returns true on success. On failure, calls `onRefreshFailed` if configured.
 */
export async function refreshCircleAccessToken(): Promise<boolean> {
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
  }
}
