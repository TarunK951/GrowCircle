"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { GoogleGlyph } from "@/components/auth/GoogleGlyph";
import {
  completeProfile,
  getMyProfile,
  mapAuthUserToProfile,
  sendOtp,
  verifyOtp,
} from "@/lib/circle/api";
import { getCircleGoogleAuthUrl } from "@/lib/circle/config";
import { circleProfileToUser } from "@/lib/circle/mappers";
import { useSessionStore } from "@/stores/session-store";

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{6,14}$/,
    "Use international format with + (e.g. +919876543210)",
  );

const otpSchema = z.string().trim().regex(/^\d{4,8}$/, "Enter the code you received");

const profileSchema = z.object({
  username: z.string().trim().min(2, "Username is required"),
  email: z.string().trim().email(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

const inputClass =
  "w-full rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-950/10";

type Step = "phone" | "otp" | "profile";

export function CirclePhoneAuth() {
  const pathname = usePathname();
  const mode = pathname === "/signup" ? "signup" : "login";
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const loginWithCircle = useSessionStore((s) => s.loginWithCircle);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);

  const otherHref = useMemo(() => {
    const q =
      returnUrl && returnUrl !== "/dashboard"
        ? `?returnUrl=${encodeURIComponent(returnUrl)}`
        : "";
    return mode === "login" ? `/signup${q}` : `/login${q}`;
  }, [mode, returnUrl]);

  const send = async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid phone");
      return;
    }
    setBusy(true);
    try {
      await sendOtp(parsed.data);
      toast.success("OTP sent");
      setStep("otp");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    const p = phoneSchema.safeParse(phone);
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
      toast.error(e instanceof Error ? e.message : "Verification failed");
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
    const accessToken = useSessionStore.getState().accessToken;
    const refreshToken = useSessionStore.getState().refreshToken;
    if (!accessToken || !refreshToken) {
      toast.error("Session expired — start again");
      setStep("phone");
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
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  const googleUrl = getCircleGoogleAuthUrl();

  return (
    <div className="mx-auto w-full max-w-md text-left">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        {mode === "signup" ? "Create account" : "Log in"}
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        {step === "profile"
          ? "Circle needs a few details to finish your profile."
          : "Sign in with your phone — we’ll send a one-time code."}
      </p>

      {step === "phone" && (
        <div className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="circle-phone"
              className="text-sm font-medium text-neutral-700"
            >
              Phone
            </label>
            <input
              id="circle-phone"
              autoComplete="tel"
              placeholder="+919876543210"
              className={`mt-2 ${inputClass}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
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

      {step === "otp" && (
        <div className="mt-8 space-y-5">
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
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={busy}
              onClick={() => void verify()}
              className="flex-1 rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
              className="rounded-xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              Back
            </button>
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

      {step !== "profile" && (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-canvas px-3 text-neutral-400">Or</span>
            </div>
          </div>

          <button
            type="button"
            disabled={!googleUrl}
            onClick={() => {
              if (googleUrl) window.location.assign(googleUrl);
            }}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <GoogleGlyph className="h-5 w-5 shrink-0" />
            Continue with Google
          </button>
        </>
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
