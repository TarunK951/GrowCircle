"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import {
  loginWithEmailPasswordApi,
  registerWithEmailPasswordApi,
} from "@/lib/auth/emailPasswordClient";
import { Eye, EyeOff, Mail, Smartphone } from "lucide-react";
import { GoogleGlyph } from "@/components/auth/GoogleGlyph";
import { cn } from "@/lib/utils";
import {
  completeProfile,
  getMyProfile,
  mapAuthUserToProfile,
  sendOtp,
  verifyOtp,
} from "@/lib/circle/api";
import { formatCircleError } from "@/lib/circle/client";
import { normalizedEmailSchema } from "@/lib/auth/apiSchemas";
import {
  getCircleGoogleAuthUrl,
  isCircleApiConfigured,
} from "@/lib/circle/config";
import { circleUsernameSchema } from "@/lib/auth/circleUsernameSchema";
import { circleProfileToUser } from "@/lib/circle/mappers";
import { store } from "@/lib/store/store";
import { useSessionStore } from "@/stores/session-store";

/** E.164 after default country code +91 (India). */
const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+91[6-9]\d{9}$/,
    "Enter a valid 10-digit mobile number (without leading 0).",
  );

const DEFAULT_CC = "91";

function toE164India(nationalDigits: string): string {
  const digits = nationalDigits.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
  return `+${DEFAULT_CC}${digits}`;
}

const otpSchema = z.string().trim().regex(/^\d{4,8}$/, "Enter the code you received");

const profileSchema = z.object({
  username: circleUsernameSchema,
  email: z.string().trim().email(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

const localLoginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(4, "Password must be at least 4 characters"),
});

const localSignupSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: normalizedEmailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const inputClass =
  "w-full rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-950/10";

/** Seconds between OTP sends (rate limit UX). */
const RESEND_COOLDOWN_SEC = 45;

function maskNationalPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length < 4) return "••••";
  return `${d.slice(0, 2)} •••• •${d.slice(-2)}`;
}

type Step = "phone" | "otp" | "profile";

/** Phone OTP (Circle API) or app-local email + password (`/api/auth/*`). */
type AuthChannel = "phone" | "email";

export function CirclePhoneAuth() {
  const pathname = usePathname();
  const mode = pathname === "/signup" ? "signup" : "login";
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const loginWithCircle = useSessionStore((s) => s.loginWithCircle);
  const loginSession = useSessionStore((s) => s.login);

  const [step, setStep] = useState<Step>("phone");
  const [authChannel, setAuthChannel] = useState<AuthChannel>("phone");
  /** One-shot per `circleProfile=1` navigation; reset when param is absent. */
  const circleProfileGateRef = useRef(false);
  /** National part only (10 digits); full number is always `+91` + this. */
  const [phoneNational, setPhoneNational] = useState("");
  const phoneE164 = useMemo(
    () => toE164India(phoneNational),
    [phoneNational],
  );
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);
  /** Countdown before "Resend code" is enabled again */
  const [resendIn, setResendIn] = useState(0);
  /** App-local email/password (not Circle backend). */
  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const [localName, setLocalName] = useState("");
  const [showLocalPassword, setShowLocalPassword] = useState(false);

  const otherHref = useMemo(() => {
    const q =
      returnUrl && returnUrl !== "/dashboard"
        ? `?returnUrl=${encodeURIComponent(returnUrl)}`
        : "";
    return mode === "login" ? `/signup${q}` : `/login${q}`;
  }, [mode, returnUrl]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  useEffect(() => {
    if (searchParams.get("circleProfile") !== "1") {
      circleProfileGateRef.current = false;
    }
  }, [searchParams]);

  /** Host flow: `/login?circleProfile=1&returnUrl=…` opens profile step when already signed in but incomplete. */
  useEffect(() => {
    if (searchParams.get("circleProfile") !== "1") return;
    if (circleProfileGateRef.current) return;

    const { accessToken, refreshToken } = store.getState().auth;

    const stripCircleProfileParam = () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("circleProfile");
      const newQuery = params.toString();
      const pathOnly = pathname || "/login";
      router.replace(newQuery ? `${pathOnly}?${newQuery}` : pathOnly);
    };

    if (!accessToken || !refreshToken) {
      stripCircleProfileParam();
      return;
    }

    circleProfileGateRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const p = await getMyProfile(accessToken);
        if (cancelled) return;

        const ru = searchParams.get("returnUrl") || "/dashboard";
        const safe =
          ru.startsWith("/") && !ru.startsWith("//") ? ru : "/dashboard";

        const pathOnly = pathname || "/login";
        const params = new URLSearchParams(searchParams.toString());
        params.delete("circleProfile");
        const newQuery = params.toString();

        if (p.is_profile_complete === true) {
          router.replace(safe);
          return;
        }

        router.replace(newQuery ? `${pathOnly}?${newQuery}` : pathOnly);
        setUsername(p.username ?? "");
        setEmail(p.email ?? "");
        const dobStr = p.dob?.trim() ?? "";
        setDob(/^\d{4}-\d{2}-\d{2}/.test(dobStr) ? dobStr.slice(0, 10) : "");
        setStep("profile");
        setAuthChannel("phone");
        toast.message("Complete your profile to continue.");
      } catch (e) {
        circleProfileGateRef.current = false;
        toast.error(formatCircleError(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, pathname, router]);

  const send = async () => {
    const parsed = phoneSchema.safeParse(phoneE164);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid phone");
      return;
    }
    setBusy(true);
    try {
      await sendOtp(parsed.data);
      toast.success("OTP sent");
      setResendIn(RESEND_COOLDOWN_SEC);
      setStep("otp");
    } catch (e) {
      toast.error(formatCircleError(e));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || busy) return;
    const parsed = phoneSchema.safeParse(phoneE164);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid phone");
      return;
    }
    setBusy(true);
    try {
      await sendOtp(parsed.data);
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SEC);
      toast.success("New code sent");
    } catch (e) {
      toast.error(formatCircleError(e));
    } finally {
      setBusy(false);
    }
  };

  const goBackToPhone = () => {
    setStep("phone");
    setOtp("");
    setResendIn(0);
    setAuthChannel("phone");
  };

  const verify = async () => {
    const p = phoneSchema.safeParse(phoneE164);
    const o = otpSchema.safeParse(otp);
    if (!p.success || !o.success) {
      toast.error("Check phone number and OTP");
      return;
    }
    setBusy(true);
    try {
      const data = await verifyOtp(p.data, o.data);
      const profile = mapAuthUserToProfile(data.user);
      loginWithCircle(circleProfileToUser(profile), {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      if (data.isProfileComplete !== true) {
        setStep("profile");
        toast.success("Signed in — complete your profile");
        return;
      }
      toast.success("Signed in");
      router.push(returnUrl);
    } catch (e) {
      toast.error(formatCircleError(e));
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    const parsed = profileSchema.safeParse({ username, email, dob });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    const { accessToken, refreshToken } = store.getState().auth;
    if (!accessToken || !refreshToken) {
      toast.error("Session expired — start again");
      setStep("phone");
      setAuthChannel("phone");
      return;
    }
    setBusy(true);
    try {
      await completeProfile(accessToken, parsed.data);
      const profile = await getMyProfile(accessToken);
      loginWithCircle(circleProfileToUser(profile), {
        accessToken,
        refreshToken,
      });
      toast.success("Profile saved");
      router.push(returnUrl);
    } catch (e) {
      toast.error(formatCircleError(e));
    } finally {
      setBusy(false);
    }
  };

  const submitLocalEmailPassword = async () => {
    setBusy(true);
    try {
      if (mode === "login") {
        const parsed = localLoginSchema.safeParse({
          email: localEmail,
          password: localPassword,
        });
        if (!parsed.success) {
          toast.error(
            parsed.error.issues[0]?.message ?? "Check your email and password.",
          );
          return;
        }
        const user = await loginWithEmailPasswordApi(
          parsed.data.email,
          parsed.data.password,
        );
        loginSession(user);
        if (isCircleApiConfigured()) {
          toast.message(
            "Signed in for this app only. To publish meets or use Circle APIs, sign in with Phone OTP.",
            { duration: 6500 },
          );
        }
        toast.success("Signed in");
        router.push(returnUrl);
        return;
      }
      const parsed = localSignupSchema.safeParse({
        name: localName,
        email: localEmail,
        password: localPassword,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Check the form");
        return;
      }
      const user = await registerWithEmailPasswordApi(parsed.data);
      loginSession(user);
      if (isCircleApiConfigured()) {
        toast.message(
          "Account created locally. To host with Circle, sign in with Phone OTP after onboarding.",
          { duration: 6500 },
        );
      }
      toast.success("Account created");
      router.push("/onboarding");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const showChannelTabs = step === "phone";

  const subtitle = (() => {
    if (step === "profile") {
      return "Circle needs a few details to finish your profile.";
    }
    if (step === "otp") {
      return `Enter the code we sent to +${DEFAULT_CC} ${maskNationalPhone(phoneNational)}.`;
    }
    if (authChannel === "email") {
      return mode === "signup"
        ? "Create an account with any email address and a password."
        : "Sign in with the email and password you used when you registered.";
    }
    return "Sign in with your phone — we’ll send a one-time code.";
  })();

  return (
    <div className="mx-auto w-full max-w-md text-left">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        {mode === "signup" ? "Create account" : "Log in"}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>

      {showChannelTabs && (
        <>
          <a
            href={getCircleGoogleAuthUrl(returnUrl)}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            <GoogleGlyph className="h-5 w-5 shrink-0" aria-hidden />
            Continue with Google
          </a>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-neutral-400">
                Or phone or email
              </span>
            </div>
          </div>

          <div
            className="grid grid-cols-2 gap-1 rounded-2xl border border-neutral-200/90 bg-neutral-100/70 p-1"
            role="tablist"
            aria-label="Sign-in method: phone or email"
          >
          <button
            type="button"
            role="tab"
            aria-selected={authChannel === "phone"}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-xs font-semibold transition sm:gap-2 sm:text-sm",
              authChannel === "phone"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800",
            )}
            onClick={() => setAuthChannel("phone")}
          >
            <Smartphone className="h-4 w-4 shrink-0" aria-hidden />
            Phone
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authChannel === "email"}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-1 py-2 text-xs font-semibold transition sm:gap-2 sm:text-sm",
              authChannel === "email"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800",
            )}
            onClick={() => setAuthChannel("email")}
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            Email
          </button>
        </div>
        </>
      )}

      {authChannel === "phone" && step === "phone" && (
        <div className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="circle-phone-national"
              className="text-sm font-medium text-neutral-700"
            >
              Phone
            </label>
            <div className="mt-2 flex min-w-0 gap-2">
              <span
                className="flex shrink-0 items-center rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 text-sm font-medium tabular-nums text-neutral-900"
                aria-hidden
              >
                +{DEFAULT_CC}
              </span>
              <input
                id="circle-phone-national"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="9876543210"
                className={`min-w-0 flex-1 ${inputClass}`}
                value={phoneNational}
                onChange={(e) =>
                  setPhoneNational(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void send()}
            className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
        </div>
      )}

      {authChannel === "email" && step === "phone" && (
        <div className="mt-8 space-y-4">
          {mode === "signup" && (
            <div>
              <label
                htmlFor="circle-local-name"
                className="text-sm font-medium text-neutral-700"
              >
                Name
              </label>
              <input
                id="circle-local-name"
                autoComplete="name"
                placeholder="Your name"
                className={`mt-2 ${inputClass}`}
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label
              htmlFor="circle-local-email"
              className="text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="circle-local-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`mt-2 ${inputClass}`}
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="circle-local-password"
              className="text-sm font-medium text-neutral-700"
            >
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="circle-local-password"
                type={showLocalPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                className={`${inputClass} pr-11`}
                value={localPassword}
                onChange={(e) => setLocalPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowLocalPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200/60 hover:text-neutral-800"
                aria-label={showLocalPassword ? "Hide password" : "Show password"}
              >
                {showLocalPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submitLocalEmailPassword()}
            className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
          >
            {busy
              ? mode === "login"
                ? "Signing in…"
                : "Creating…"
              : mode === "login"
                ? "Sign in with email"
                : "Create account"}
          </button>
        </div>
      )}

      {authChannel === "phone" && step === "otp" && (
        <div className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="circle-otp"
              className="text-sm font-medium text-neutral-700"
            >
              One-time code
            </label>
            <input
              id="circle-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className={`mt-2 ${inputClass}`}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
            />
          </div>

          <div className="space-y-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => void verify()}
              className="w-full rounded-xl bg-neutral-950 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify & continue"}
            </button>

            <div className="rounded-2xl border border-neutral-200/90 bg-linear-to-b from-neutral-50/90 to-neutral-100/40 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <button
                  type="button"
                  disabled={busy}
                  onClick={goBackToPhone}
                  className="order-2 inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200/90 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60 sm:order-1 sm:w-auto sm:py-2.5"
                >
                  <span aria-hidden className="text-base leading-none text-neutral-400">
                    ←
                  </span>
                  Change number
                </button>

                <div className="order-1 flex flex-col items-stretch gap-1 border-b border-neutral-200/80 pb-4 sm:order-2 sm:items-end sm:border-b-0 sm:pb-0">
                  <span className="text-xs font-medium text-neutral-500 sm:text-right">
                    Didn&apos;t get the code?
                  </span>
                  <button
                    type="button"
                    disabled={busy || resendIn > 0}
                    onClick={() => void resend()}
                    className="text-left text-sm font-semibold text-brand underline decoration-brand/30 underline-offset-[3px] transition hover:decoration-brand disabled:cursor-not-allowed disabled:no-underline disabled:opacity-45 sm:text-right"
                  >
                    {resendIn > 0
                      ? `Resend in ${resendIn}s`
                      : "Resend code"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "profile" && (
        <div className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Username
            </label>
            <input
              className={`mt-2 ${inputClass}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <p className="mt-1.5 text-xs text-neutral-600">
              Letters and numbers only — no spaces or symbols.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              type="email"
              className={`mt-2 ${inputClass}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Date of birth
            </label>
            <input
              type="date"
              className={`mt-2 ${inputClass}`}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void saveProfile()}
            className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save and continue"}
          </button>
        </div>
      )}

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
