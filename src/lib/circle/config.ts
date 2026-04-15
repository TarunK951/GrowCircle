/**
 * Public Circle HTTP API root (includes `/api` path segment).
 * Source: API documentation **Base URL** — `https://…/api` (events, auth, profile, etc.).
 * Override with `NEXT_PUBLIC_CIRCLE_API_BASE` in `.env.local` for another deployment.
 * Local backend example: `http://localhost:3001` (resolves to `http://localhost:3001/api`).
 */
export const CIRCLE_API_BASE_DEFAULT =
  "https://circle-backend-production-e6c9.up.railway.app/api";

/**
 * Resolves the Circle HTTP API root (`…/api`).
 *
 * - **Browser:** uses `NEXT_PUBLIC_CIRCLE_API_BASE` when set, else the production default.
 * - **Server (Route Handlers, SSR):** prefers `CIRCLE_API_BASE` when set (not exposed to the
 *   client bundle) so uploads and API calls use the real backend even if
 *   `NEXT_PUBLIC_CIRCLE_API_BASE` was pointed at `http://localhost:…` for local experiments.
 *   If unset, falls through to the same `NEXT_PUBLIC_*` + default logic.
 */
export function getCircleApiBase(): string {
  const fallback = CIRCLE_API_BASE_DEFAULT.replace(/\/+$/, "");

  const normalize = (raw: string): string => {
    let base = raw.replace(/\/+$/, "");
    if (!/\/api$/i.test(base)) {
      base = `${base}/api`;
    }
    return base;
  };

  if (typeof window === "undefined") {
    const serverOnly = process.env.CIRCLE_API_BASE?.trim();
    if (serverOnly) {
      return normalize(serverOnly);
    }
  }

  const raw = process.env.NEXT_PUBLIC_CIRCLE_API_BASE?.trim();
  if (!raw) return fallback;
  return normalize(raw);
}

/**
 * When `true` (default), the app uses Circle phone/Google auth and HTTP API features.
 * Set `NEXT_PUBLIC_USE_CIRCLE_AUTH=false` to use the legacy email/password forms in
 * `UnifiedAuthForm` instead (local `/api/auth/login` routes).
 */
export function isCircleApiConfigured(): boolean {
  return process.env.NEXT_PUBLIC_USE_CIRCLE_AUTH !== "false";
}

/**
 * Public site origin for OAuth token handoff after the **backend** finishes Google OAuth.
 * Set `NEXT_PUBLIC_APP_URL=https://your-domain.com` in production so the callback URL is stable.
 *
 * **Google Cloud “Authorized redirect URIs”** must point at **this app**, not the Railway host:
 * `{NEXT_PUBLIC_APP_URL or localhost}/api/auth/google/callback`. Google returns here; our route
 * exchanges the `code` with the Circle API server-side and redirects to `/auth/google/callback`
 * with tokens (see `src/app/api/auth/google/callback/route.ts`).
 */
export function getPublicAppBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/**
 * Same-origin path for {@link uploadBlobToCircleStorageViaApp}. Always use a **relative** `/api/…`
 * URL in the browser so no host is hardcoded (avoids embedding `localhost` in the fetch target;
 * the browser resolves it to the current origin — LAN, tunnel, or production).
 */
export function getCirclePresignedUploadProxyUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/circle-presigned-upload";
  }
  const app = getPublicAppBaseUrl();
  if (app) return `${app}/api/circle-presigned-upload`;
  return "/api/circle-presigned-upload";
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
