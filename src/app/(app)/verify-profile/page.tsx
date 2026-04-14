"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getMyProfile } from "@/lib/circle/api";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { selectAccessToken } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";

const tierLabel = (n: number) => {
  switch (n) {
    case 0:
      return "None";
    case 1:
      return "Email verified";
    case 2:
      return "Phone verified";
    case 3:
      return "ID verified";
    default:
      return `Tier ${n}`;
  }
};

export default function VerifyProfilePage() {
  const accessToken = useAppSelector(selectAccessToken);
  const setVerified = useSessionStore((s) => s.setVerified);
  const [tier, setTier] = useState<number | null>(null);
  const [banned, setBanned] = useState<boolean | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const circleMode = isCircleApiConfigured() && Boolean(accessToken);

  useEffect(() => {
    if (!circleMode) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const p = await getMyProfile(accessToken!);
        if (cancelled) return;
        setTier(p.verification_tier ?? 0);
        setBanned(p.is_globally_banned === true);
        if ((p.verification_tier ?? 0) >= 1) {
          setVerified(true);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof CircleApiError
              ? e.message
              : "Could not load verification status",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [circleMode, accessToken, setVerified]);

  if (circleMode) {
    return (
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Verify profile</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Verification tier and profile status come from{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs">GET /users/me</code>
          . Higher tiers are assigned by support or admin review — there is no
          SMS or document upload step in this app.
        </p>
        <div className="mt-8 rounded-2xl border border-primary/10 bg-white/50 p-6">
          {loading && (
            <p className="text-sm text-neutral-700">Loading status…</p>
          )}
          {!loading && tier !== null && (
            <>
              <p className="text-xs font-semibold uppercase text-neutral-900">
                Current tier
              </p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {tierLabel(tier)}
              </p>
              {profileComplete !== null && (
                <p className="mt-3 text-sm text-neutral-700">
                  Profile complete:{" "}
                  <span className="font-semibold text-neutral-900">
                    {profileComplete ? "Yes" : "No"}
                  </span>
                </p>
              )}
              {banned === true && (
                <p className="mt-4 text-sm font-medium text-red-700">
                  This account has a global restriction. Contact support if this
                  is unexpected.
                </p>
              )}
            </>
          )}
        </div>
        <p className="mt-6 text-sm text-neutral-600">
          <Link href="/profile" className="font-semibold text-primary underline">
            Profile settings
          </Link>
          {" · "}
          <span>
            Questions about verification? Contact support through your usual
            Circle channel.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Verify profile</h1>
      <p className="mt-2 text-neutral-900">
        Connect the Circle backend (
        <code className="rounded bg-neutral-100 px-1 text-xs">
          NEXT_PUBLIC_CIRCLE_API_BASE
        </code>
        ) and sign in with your phone to see verification status from the
        server.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-sm font-semibold text-primary underline"
      >
        Go to login
      </Link>
    </div>
  );
}
