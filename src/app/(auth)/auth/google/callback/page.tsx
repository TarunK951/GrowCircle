"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMyProfile } from "@/lib/circle/api";
import {
  getGoogleOAuthCallbackUrl,
} from "@/lib/circle/config";
import { circleProfileToUser } from "@/lib/circle/mappers";
import { useSessionStore } from "@/stores/session-store";

function parseOAuthTokensFromWindow(): {
  accessToken: string | null;
  refreshToken: string | null;
  returnUrl: string;
  oauthError: string | null;
  oauthErrorDescription: string | null;
} {
  if (typeof window === "undefined") {
    return {
      accessToken: null,
      refreshToken: null,
      returnUrl: "/dashboard",
      oauthError: null,
      oauthErrorDescription: null,
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
  const dataParam = pick("data");
  if ((!accessToken || !refreshToken) && dataParam) {
    try {
      const decoded = JSON.parse(
        dataParam.startsWith("{") ? dataParam : atob(dataParam),
      ) as Record<string, unknown>;
      const at =
        (typeof decoded.accessToken === "string" && decoded.accessToken) ||
        (typeof decoded.access_token === "string" && decoded.access_token);
      const rt =
        (typeof decoded.refreshToken === "string" && decoded.refreshToken) ||
        (typeof decoded.refresh_token === "string" && decoded.refresh_token);
      if (typeof at === "string") accessToken = at;
      if (typeof rt === "string") refreshToken = rt;
    } catch {
      /* ignore */
    }
  }
  return {
    accessToken,
    refreshToken,
    returnUrl: pick("returnUrl") ?? "/dashboard",
    oauthError: pick("error"),
    oauthErrorDescription: pick("error_description"),
  };
}

/**
 * OAuth return URL — backend redirects here after Google consent.
 * Tokens may be in **query** or **hash** (`accessToken`/`refreshToken` or snake_case).
 */
function GoogleCallbackInner() {
  const router = useRouter();
  const loginWithCircle = useSessionStore((s) => s.loginWithCircle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const {
      accessToken,
      refreshToken,
      returnUrl,
      oauthError,
      oauthErrorDescription,
    } = parseOAuthTokensFromWindow();

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
      setError("missing_tokens");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const profile = await getMyProfile(accessToken);
        if (cancelled) return;
        const user = circleProfileToUser(profile);
        loginWithCircle(user, { accessToken, refreshToken });
        toast.success("Signed in with Google");
        const safe =
          returnUrl.startsWith("/") && !returnUrl.startsWith("//")
            ? returnUrl
            : "/dashboard";
        router.replace(safe);
      } catch {
        if (!cancelled) setError("profile");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loginWithCircle, router]);

  const registeredCallback =
    getGoogleOAuthCallbackUrl() ??
    "(set NEXT_PUBLIC_APP_URL to show your app callback URL)";

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

  if (error === "profile") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-neutral-900">
        <p className="text-sm font-medium">
          Signed in but could not load your profile. Try again from the login
          page.
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
