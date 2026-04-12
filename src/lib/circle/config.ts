/**
 * Circle backend (see API docs). Set in `.env.local`:
 * `NEXT_PUBLIC_CIRCLE_API_BASE=https://circle-backend-production-e6c9.up.railway.app/api`
 */
export function getCircleApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_CIRCLE_API_BASE?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function isCircleApiConfigured(): boolean {
  return getCircleApiBase() !== null;
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

/** §1.6 Google OAuth — browser redirect to Circle (`GET /api/auth/google`) */
export function getCircleGoogleAuthUrl(): string | null {
  const b = getCircleApiBase();
  return b ? `${b}/auth/google` : null;
}
