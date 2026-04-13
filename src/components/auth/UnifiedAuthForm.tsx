"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GoogleGlyph } from "@/components/auth/GoogleGlyph";
import { CirclePhoneAuth } from "@/components/auth/CirclePhoneAuth";
import {
  requestEmailOtpApi,
  verifyEmailOtpApi,
} from "@/lib/auth/emailPasswordClient";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { useSessionStore } from "@/stores/session-store";

const inputClass =
  "w-full rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-950/10";

const RESEND_COOLDOWN_SEC = 45;

/**
 * Single form for /login and /signup — email OTP when `NEXT_PUBLIC_USE_CIRCLE_AUTH=false`.
 */
export function UnifiedAuthForm() {
  const pathname = usePathname();
  const mode = pathname === "/signup" ? "signup" : "login";
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const loginSession = useSessionStore((s) => s.login);

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    setStep("email");
    setEmail("");
    setName("");
    setOtp("");
  }, [mode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  const otherHref = useMemo(() => {
    const q =
      returnUrl && returnUrl !== "/dashboard"
        ? `?returnUrl=${encodeURIComponent(returnUrl)}`
        : "";
    return mode === "login" ? `/signup${q}` : `/login${q}`;
  }, [mode, returnUrl]);

  const purpose = mode === "login" ? "login" : "signup";

  const sendCode = async () => {
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      toast.error("Enter your name (at least 2 characters).");
      return;
    }
    setBusy(true);
    try {
      const { devOtp } = await requestEmailOtpApi(em, purpose);
      setEmail(em);
      setStep("otp");
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SEC);
      toast.success("Check your email for a sign-in code.");
      if (devOtp) {
        toast.message(`Dev OTP: ${devOtp}`, { duration: 12_000 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    try {
      const user =
        mode === "signup"
          ? await verifyEmailOtpApi({
              email,
              purpose: "signup",
              code,
              name: name.trim(),
            })
          : await verifyEmailOtpApi({
              email,
              purpose: "login",
              code,
            });
      loginSession(user);
      toast.success(mode === "login" ? "Signed in" : "Welcome to ConnectSphere");
      router.push(mode === "login" ? returnUrl : "/onboarding");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not verify code.");
    } finally {
      setBusy(false);
    }
  };

  if (isCircleApiConfigured()) {
    return <CirclePhoneAuth />;
  }

  return (
    <div className="mx-auto w-full max-w-md text-left">
      {mode === "login" ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Log in
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {step === "email"
              ? "Enter your email and we’ll send you a one-time code."
              : `Enter the code we sent to ${email}.`}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Create account
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {step === "email"
              ? "Join ConnectSphere — we’ll email you a code to verify."
              : `Enter the code we sent to ${email}.`}
          </p>
        </>
      )}

      {step === "email" ? (
        <div className="mt-8 space-y-5">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="auth-name"
                className="text-sm font-medium text-neutral-700"
              >
                Name
              </label>
              <input
                id="auth-name"
                autoComplete="name"
                placeholder="Your name"
                className={`mt-2 ${inputClass}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label
              htmlFor="auth-email"
              className="text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`mt-2 ${inputClass}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void sendCode()}
            className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="auth-otp"
              className="text-sm font-medium text-neutral-700"
            >
              One-time code
            </label>
            <input
              id="auth-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={`mt-2 ${inputClass} tabular-nums tracking-widest`}
              value={otp}
              maxLength={6}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void verify()}
            className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
          >
            {busy ? "Verifying…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              className="font-medium text-neutral-600 underline-offset-2 hover:text-neutral-950 hover:underline"
              onClick={() => {
                setStep("email");
                setOtp("");
              }}
            >
              Change email
            </button>
            <button
              type="button"
              disabled={busy || resendIn > 0}
              className="font-medium text-neutral-600 underline-offset-2 hover:text-neutral-950 hover:underline disabled:opacity-50"
              onClick={() => void sendCode()}
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-neutral-400">Or Continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          toast.message(
            mode === "login"
              ? "Google sign-in is not connected in this demo."
              : "Google sign-up is not connected in this demo.",
          )
        }
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
      >
        <GoogleGlyph className="h-5 w-5 shrink-0" />
        Continue with Google
      </button>

      <p className="mt-10 text-sm text-neutral-500">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href={otherHref}
              className="font-semibold text-brand underline decoration-brand/35 underline-offset-[3px] transition hover:decoration-brand"
            >
              Sign up here
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={otherHref}
              className="font-semibold text-brand underline decoration-brand/35 underline-offset-[3px] transition hover:decoration-brand"
            >
              Log in here
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
