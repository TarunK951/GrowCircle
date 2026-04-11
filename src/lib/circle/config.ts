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

/** §1.6 Google OAuth — browser redirect */
export function getCircleGoogleAuthUrl(): string | null {
  const b = getCircleApiBase();
  return b ? `${b}/auth/google` : null;
}
