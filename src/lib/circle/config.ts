/**
 * Public Circle HTTP API root (includes `/api` path segment).
 * Source: API documentation **Base URL** — `https://…/api` (events, auth, profile, etc.).
 * Override with `NEXT_PUBLIC_CIRCLE_API_BASE` in `.env.local` for another deployment.
 */
export const CIRCLE_API_BASE_DEFAULT =
  "https://circle-backend-production-e6c9.up.railway.app/api";

/**
 * Resolves the Circle HTTP API root (`…/api`). Uses `NEXT_PUBLIC_CIRCLE_API_BASE` when set;
 * otherwise the documented production default (same as API docs) so OTP and Google work
 * without extra env. If the env value is a bare origin, `/api` is appended.
 */
export function getCircleApiBase(): string {
  const fallback = CIRCLE_API_BASE_DEFAULT.replace(/\/+$/, "");
  const raw = process.env.NEXT_PUBLIC_CIRCLE_API_BASE?.trim();
  if (!raw) return fallback;
  let base = raw.replace(/\/+$/, "");
  if (!/\/api$/i.test(base)) {
    base = `${base}/api`;
  }
  return base;
}

export function isCircleApiConfigured(): boolean {
  return true;
}

/**
 * Public site origin for OAuth redirect registration (server and docs).
 * Set `NEXT_PUBLIC_APP_URL=https://your-domain.com` in production so the callback URL is stable.
 */
export function getPublicAppBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/**
 * Register this exact URL on the Circle backend as the Google OAuth **redirect / callback** target.
 * Example: `https://app.example.com/auth/google/callback`
 *
 * After Google consent, the backend should redirect the browser here with tokens in the **query string**
 * or **hash** (`accessToken` + `refreshToken`, or `access_token` + `refresh_token`; optional `returnUrl`).
 *
 * @see `src/app/(auth)/auth/google/callback/page.tsx`
 */
export function getGoogleOAuthCallbackUrl(): string | null {
  const base = getPublicAppBaseUrl();
  return base ? `${base}/auth/google/callback` : null;
}

/**
 * §1.6 Google OAuth — browser redirect to Circle (`GET /api/auth/google`).
 * Optional `returnUrl` is forwarded so the backend can append it when redirecting to this app
 * with tokens (see `/auth/google/callback`).
 */
export function getCircleGoogleAuthUrl(returnUrl?: string | null): string {
  const b = getCircleApiBase();
  const url = new URL(`${b}/auth/google`);
  const next =
    returnUrl?.trim() &&
    returnUrl.trim().startsWith("/") &&
    !returnUrl.trim().startsWith("//")
      ? returnUrl.trim()
      : null;
  if (next) url.searchParams.set("returnUrl", next);
  return url.toString();
}
