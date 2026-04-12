import { NextRequest, NextResponse } from "next/server";
import { getCircleApiBase } from "@/lib/circle/config";

function resolveAppOrigin(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  return request.nextUrl.origin;
}

/**
 * Google redirects here (`/api/auth/google/callback`) with `?code=...`.
 * We call the Circle backend with the same query string (server-side), read the JSON tokens,
 * then redirect the browser to `/auth/google/callback` with tokens so the session can be saved
 * and the user lands on the home page — not on the backend’s raw JSON response.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const appOrigin = resolveAppOrigin(request);

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const login = new URL("/login", appOrigin);
    login.searchParams.set("error", oauthError);
    const desc = url.searchParams.get("error_description");
    if (desc) login.searchParams.set("error_description", desc);
    return NextResponse.redirect(login, 307);
  }

  const base = getCircleApiBase().replace(/\/+$/, "");
  const backendUrl = `${base}/auth/google/callback${url.search}`;

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=google_network", appOrigin),
      307,
    );
  }

  const text = await upstream.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(`google_callback_${upstream.status}`)}`,
        appOrigin,
      ),
      307,
    );
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.success !== true) {
    const msg =
      typeof obj.message === "string" ? obj.message : "Sign-in failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, appOrigin),
      307,
    );
  }

  const data = obj.data;
  if (!data || typeof data !== "object") {
    return NextResponse.redirect(
      new URL("/login?error=missing_tokens", appOrigin),
      307,
    );
  }

  const d = data as Record<string, unknown>;
  const accessToken = d.accessToken ?? d.access_token;
  const refreshToken = d.refreshToken ?? d.refresh_token;

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    return NextResponse.redirect(
      new URL("/login?error=missing_tokens", appOrigin),
      307,
    );
  }

  const dest = new URL("/auth/google/callback", appOrigin);
  dest.searchParams.set("accessToken", accessToken);
  dest.searchParams.set("refreshToken", refreshToken);
  const returnUrl = url.searchParams.get("returnUrl");
  if (returnUrl?.startsWith("/") && !returnUrl.startsWith("//")) {
    dest.searchParams.set("returnUrl", returnUrl);
  }

  return NextResponse.redirect(dest, 307);
}
