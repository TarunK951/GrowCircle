import { NextRequest, NextResponse } from "next/server";
import { getCircleApiBase } from "@/lib/circle/config";

/**
 * Google redirects here with `?code=...` (same `redirect_uri` the Circle backend sends in §1.6).
 * Forward the full query string to the Circle API so it can exchange the code and then redirect
 * the browser back to this app with `accessToken` / `refreshToken` on `/auth/google/callback`.
 */
export function GET(request: NextRequest) {
  const url = request.nextUrl;
  const base = getCircleApiBase().replace(/\/+$/, "");
  const dest = new URL(`${base}/auth/google/callback`);
  dest.search = url.search;
  return NextResponse.redirect(dest, 307);
}
