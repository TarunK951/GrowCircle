"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMyProfile, mapAuthUserToProfile } from "@/lib/circle/api";
import { formatCircleError } from "@/lib/circle/client";
import { getGoogleOAuthCallbackUrl } from "@/lib/circle/config";
import { circleProfileToUser } from "@/lib/circle/mappers";
import type { CircleAuthUser } from "@/lib/circle/types";
import { useSessionStore } from "@/stores/session-store";

const DEFAULT_GOOGLE_SUCCESS_PATH = "/";

function pickTokensFromRecord(o: Record<string, unknown>): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  const accessToken =
    (typeof o.accessToken === "string" && o.accessToken) ||
    (typeof o.access_token === "string" && o.access_token) ||
    null;
  const refreshToken =
    (typeof o.refreshToken === "string" && o.refreshToken) ||
    (typeof o.refresh_token === "string" && o.refresh_token) ||
    null;
  return { accessToken, refreshToken };
}

function parseOAuthTokensFromWindow(): {
  accessToken: string | null;
  refreshToken: string | null;
  oauthError: string | null;
  oauthErrorDescription: string | null;
  /** Google sends this when the redirect URI is registered to this origin; Circle must exchange it. */
  authorizationCode: string | null;
  /** When backend passes full envelope in `data`, use this user for login if profile fetch fails. */
  authUserFallback: CircleAuthUser | null;
  /** Backend JSON envelope explicitly failed (`success: false`). */
  apiFailureMessage: string | null;
} {
  if (typeof window === "undefined") {
    return {
      accessToken: null,
      refreshToken: null,
      oauthError: null,
      oauthErrorDescription: null,
      authorizationCode: null,
      authUserFallback: null,
      apiFailureMessage: null,
    };
  }
  const q = new URLSearchParams(window.location.search);
  const h = new URLSearchParams(
    window.location.hash.replace(/^#/, "").replace(/^\?/, ""),
  );
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = q.get(k) ?? h.get(k);
      if (v) return v;
    }
    return null;
  };
  let accessToken = pick("accessToken", "access_token");
  let refreshToken = pick("refreshToken", "refresh_token");
  let authUserFallback: CircleAuthUser | null = null;
  const dataParam = pick("data");
  if ((!accessToken || !refreshToken) && dataParam) {
    try {
      const decoded = JSON.parse(
        dataParam.startsWith("{") ? dataParam : atob(dataParam),
      ) as Record<string, unknown>;
      if (decoded.success === false) {
        return {
          accessToken: null,
          refreshToken: null,
          oauthError: null,
          oauthErrorDescription: null,
          authorizationCode: pick("code"),
          authUserFallback: null,
          apiFailureMessage:
            typeof decoded.message === "string"
              ? decoded.message
              : "Sign-in failed",
        };
      }
      const inner =
        decoded.success === true &&
        decoded.data !== null &&
        typeof decoded.data === "object"
          ? (decoded.data as Record<string, unknown>)
          : decoded;
      const fromInner = pickTokensFromRecord(inner);
      const fromRoot = pickTokensFromRecord(decoded);
      if (!accessToken) accessToken = fromInner.accessToken ?? fromRoot.accessToken;
      if (!refreshToken) refreshToken = fromInner.refreshToken ?? fromRoot.refreshToken;
      const u = inner.user;
      if (u && typeof u === "object" && u !== null) {
        const raw = u as Record<string, unknown>;
        const id = typeof raw.id === "string" ? raw.id : null;
        const phone = typeof raw.phone === "string" ? raw.phone : "";
        if (id) {
          authUserFallback = {
            id,
            phone,
            username:
              typeof raw.username === "string" || raw.username === null
                ? raw.username
                : undefined,
            email:
              typeof raw.email === "string" || raw.email === null
                ? raw.email
                : undefined,
            verification_tier:
              typeof raw.verification_tier === "number"
                ? raw.verification_tier
                : undefined,
            is_profile_complete:
              raw.is_profile_complete === true || raw.isProfileComplete === true,
          };
        }
      }
    } catch {
      /* ignore */
    }
  }
  return {
    accessToken,
    refreshToken,
    oauthError: pick("error"),
    oauthErrorDescription: pick("error_description"),
    authorizationCode: pick("code"),
    authUserFallback,
    apiFailureMessage: null,
  };
}

/**
 * OAuth return URL — backend redirects here after Google consent.
 * When `success` is true, tokens load from query/hash or from a JSON `data` envelope; we call
 * `GET /users/me` with the access token, persist the session, then redirect to `/`.
 */
function GoogleCallbackInner() {
  const router = useRouter();
  const loginWithCircle = useSessionStore((s) => s.loginWithCircle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const {
      accessToken,
      refreshToken,
      oauthError,
      oauthErrorDescription,
      authorizationCode,
      authUserFallback,
      apiFailureMessage,
    } = parseOAuthTokensFromWindow();

    if (apiFailureMessage) {
      setError(`api_failed:${apiFailureMessage}`);
      return;
    }

    if (oauthError) {
      setError(
        `oauth_denied:${oauthError}:${oauthErrorDescription ?? ""}`.slice(
          0,
          500,
        ),
      );
      return;
    }

    if (!accessToken || !refreshToken) {
      if (authorizationCode) {
        const apiCallback = new URL(
          "/api/auth/google/callback",
          window.location.origin,
        );
        apiCallback.search = window.location.search;
        window.location.replace(apiCallback.toString());
        return;
      }
      setError("missing_tokens");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        let profile;
        try {
          profile = await getMyProfile(accessToken);
        } catch (e) {
          if (authUserFallback) {
            profile = mapAuthUserToProfile(authUserFallback);
          } else {
            throw e;
          }
        }
        if (cancelled) return;
        const user = circleProfileToUser(profile);
        loginWithCircle(user, { accessToken, refreshToken });
        toast.success("Signed in with Google");
        router.replace(DEFAULT_GOOGLE_SUCCESS_PATH);
      } catch (e) {
        if (!cancelled) setError(`profile:${formatCircleError(e)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loginWithCircle, router]);

  const registeredCallback =
    getGoogleOAuthCallbackUrl() ??
    "(set NEXT_PUBLIC_APP_URL to show your app callback URL)";

  if (error?.startsWith("api_failed:")) {
    const msg = error.slice("api_failed:".length).trim();
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-neutral-900">
        <p className="text-sm font-medium">
          {msg || "Sign-in failed. Please try again."}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-violet-800 underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  if (error?.startsWith("oauth_denied:")) {
    const parts = error.split(":");
    const code = parts[1] ?? "access_denied";
    const desc = parts.slice(2).join(":").replace(/\+/g, " ") || null;
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-neutral-900">
        <p className="text-sm font-medium">
          Google sign-in did not complete ({code}
          {desc ? `: ${desc}` : ""}).
        </p>
        <p className="mt-3 text-xs text-neutral-600">
          Ensure the Circle backend&apos;s Google OAuth client allows this app,
          and that after consent it redirects to your app with tokens (see API
          docs §1.7).
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-violet-800 underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  if (error === "missing_tokens") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-neutral-900">
        <p className="text-sm font-medium">
          Could not complete sign-in (missing tokens). Configure the Circle
          backend to redirect to this app&apos;s callback with{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs">
            accessToken
          </code>{" "}
          and{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs">
            refreshToken
          </code>{" "}
          in the <strong>query string</strong> or <strong>hash</strong> (snake_case
          supported).
        </p>
        <p className="mt-4 text-xs text-neutral-600">
          Register on backend:{" "}
          <code className="break-all rounded bg-neutral-100 px-1">
            {registeredCallback}
          </code>
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-violet-800 underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  if (error?.startsWith("profile:")) {
    const detail = error.slice("profile:".length).trim();
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-neutral-900">
        <p className="text-sm font-medium">
          Signed in but could not load your profile
          {detail ? `: ${detail}` : ""}.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-violet-800 underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-neutral-700">
      Completing sign-in…
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-md px-4 py-16 text-center text-sm text-neutral-700">
          Loading…
        </p>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
