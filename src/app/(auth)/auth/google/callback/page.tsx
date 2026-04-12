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
} {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, returnUrl: "/dashboard" };
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
  return {
    accessToken: pick("accessToken", "access_token"),
    refreshToken: pick("refreshToken", "refresh_token"),
    returnUrl: pick("returnUrl") ?? "/dashboard",
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
    const { accessToken, refreshToken, returnUrl } =
      parseOAuthTokensFromWindow();

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
