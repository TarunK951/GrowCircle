"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { getMyProfile, updateMyProfile } from "@/lib/circle/api";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { circleUsernameSchema } from "@/lib/auth/circleUsernameSchema";
import { ageFromIsoDate } from "@/lib/date/ageFromDob";
import { cn } from "@/lib/utils";
import { circleProfileToUser } from "@/lib/circle/mappers";
import type { CircleProfile } from "@/lib/circle/types";
import {
  selectAccessToken,
  selectRefreshToken,
  selectUser,
} from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";

function displayLine(s: string | null | undefined): string {
  const t = s?.trim();
  return t ? t : "—";
}

const circleFormSchema = z.object({
  name: circleUsernameSchema,
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose your date of birth (YYYY-MM-DD)"),
  bio: z.string().max(2000),
  city: z.string().max(120),
  dietary_preference: z.string().max(200),
  emergency_contact_name: z.string().max(120),
  emergency_contact_phone: z.string().max(32),
});

const localFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
});

type CircleForm = z.infer<typeof circleFormSchema>;
type LocalForm = z.infer<typeof localFormSchema>;

export default function ProfilePage() {
  const user = useAppSelector(selectUser);
  const updateProfile = useSessionStore((s) => s.updateProfile);
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const loginWithCircle = useSessionStore((s) => s.loginWithCircle);

  const circleSync =
    isCircleApiConfigured() && Boolean(accessToken && refreshToken);

  const [phoneDisplay, setPhoneDisplay] = useState<string | null>(null);
  /** Latest full API profile for read-only metadata and extended fields. */
  const [fullProfile, setFullProfile] = useState<CircleProfile | null>(null);
  /** Once the API returns a saved DOB, it cannot be edited (product policy). */
  const [dobLocked, setDobLocked] = useState(false);

  const resolver = useMemo(
    () =>
      zodResolver(circleSync ? circleFormSchema : localFormSchema) as never,
    [circleSync],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CircleForm | LocalForm>({
    resolver,
    defaultValues: circleSync
      ? {
          name: user?.name ?? "",
          dob: "",
          bio: "",
          city: "",
          dietary_preference: "",
          emergency_contact_name: "",
          emergency_contact_phone: "",
        }
      : { name: user?.name ?? "" },
  });

  const allValues = watch();
  const dobWatch =
    circleSync && allValues && typeof allValues === "object" && "dob" in allValues
      ? String((allValues as CircleForm).dob ?? "")
      : "";
  const computedAge = useMemo(
    () =>
      dobWatch && /^\d{4}-\d{2}-\d{2}$/.test(dobWatch)
        ? ageFromIsoDate(dobWatch)
        : null,
    [dobWatch],
  );

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken || !refreshToken) return;
    let cancelled = false;
    void (async () => {
      try {
        const profile = await getMyProfile(accessToken);
        if (cancelled) return;
        setFullProfile(profile);
        const u = circleProfileToUser(profile);
        loginWithCircle(u, { accessToken, refreshToken });
        setPhoneDisplay(profile.phone);
        const dobStr = profile.dob?.trim() ?? "";
        const dob =
          /^\d{4}-\d{2}-\d{2}/.test(dobStr) ? dobStr.slice(0, 10) : "";
        const hasSavedDob = /^\d{4}-\d{2}-\d{2}$/.test(dob);
        setDobLocked(hasSavedDob);
        reset({
          name: profile.username?.trim() || u.name,
          dob,
          bio: profile.bio?.trim() ?? "",
          city: profile.city?.trim() ?? "",
          dietary_preference: profile.dietary_preference?.trim() ?? "",
          emergency_contact_name: profile.emergency_contact_name?.trim() ?? "",
          emergency_contact_phone: profile.emergency_contact_phone?.trim() ?? "",
        } as CircleForm & LocalForm);
      } catch (e) {
        if (!cancelled && e instanceof CircleApiError) {
          toast.error(e.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshToken, loginWithCircle, reset, circleSync]);

  const emailShown = displayLine(user?.email);
  const phoneShown =
    phoneDisplay && phoneDisplay.trim().length > 0
      ? phoneDisplay.trim()
      : "Not linked";

  return (
    <div className="mx-auto w-full max-w-3xl text-neutral-900">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          Profile
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
          How you appear across Grow Circle.{" "}
          {circleSync
            ? "Updates sync to your Circle account."
            : "Sign in with Circle to unlock full profile fields."}
        </p>
      </div>

      <div
        className="mb-8 flex gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm"
        role="status"
      >
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
          aria-hidden
        />
        <div>
          <p className="font-semibold text-amber-950">Visible to others</p>
          <p className="mt-1 text-amber-950/90">
            Your display name can show on meets, bookings, and messages. You may
            change your display name anytime. Date of birth is used for age
            eligibility on meets — after it&apos;s saved once, it can&apos;t be
            changed here.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,220px)_1fr] lg:items-start">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-200/80 bg-linear-to-b from-white to-neutral-50/80 p-6 shadow-sm lg:sticky lg:top-24">
          <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-neutral-200 bg-neutral-100 shadow-inner">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-neutral-700">
                {(user?.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              user?.verified
                ? "bg-emerald-100 text-emerald-900"
                : "bg-neutral-200 text-neutral-900"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {user?.verified ? "Verified" : "Not verified"}
          </div>
          {!user?.verified && (
            <Link
              href="/verify-profile"
              className="text-center text-sm font-semibold text-violet-800 underline-offset-4 hover:underline"
            >
              Verify profile
            </Link>
          )}
        </div>

        <form
          key={circleSync ? "circle" : "local"}
          className="space-y-8 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit(async (data) => {
            if (circleSync) {
              const d = data as CircleForm;
              try {
                const profile = await updateMyProfile(accessToken!, {
                  username: d.name.trim(),
                  ...(dobLocked ? {} : { dob: d.dob }),
                  bio: d.bio.trim(),
                  city: d.city.trim(),
                  dietary_preference: d.dietary_preference.trim(),
                  emergency_contact_name: d.emergency_contact_name.trim(),
                  emergency_contact_phone: d.emergency_contact_phone.trim(),
                });
                setFullProfile(profile);
                const u = circleProfileToUser(profile);
                loginWithCircle(u, {
                  accessToken: accessToken!,
                  refreshToken: refreshToken!,
                });
                setPhoneDisplay(profile.phone);
                const saved = profile.dob?.trim() ?? "";
                if (/^\d{4}-\d{2}-\d{2}/.test(saved)) {
                  setDobLocked(true);
                }
                toast.success("Profile updated");
              } catch (e) {
                const msg =
                  e instanceof CircleApiError
                    ? e.message
                    : e instanceof Error
                      ? e.message
                      : "Could not update profile";
                if (
                  typeof msg === "string" &&
                  /dob|birth|date/i.test(msg) &&
                  !dobLocked
                ) {
                  try {
                    const profile = await updateMyProfile(accessToken!, {
                      username: d.name.trim(),
                      bio: d.bio.trim(),
                      city: d.city.trim(),
                      dietary_preference: d.dietary_preference.trim(),
                      emergency_contact_name: d.emergency_contact_name.trim(),
                      emergency_contact_phone: d.emergency_contact_phone.trim(),
                    });
                    setFullProfile(profile);
                    const u = circleProfileToUser(profile);
                    loginWithCircle(u, {
                      accessToken: accessToken!,
                      refreshToken: refreshToken!,
                    });
                    toast.message(
                      "Display name saved. Date of birth could not be updated — your API may only allow it during signup.",
                    );
                  } catch (e2) {
                    toast.error(
                      e2 instanceof CircleApiError
                        ? e2.message
                        : "Could not update profile",
                    );
                  }
                } else {
                  toast.error(msg);
                }
              }
              return;
            }
            updateProfile({ name: (data as LocalForm).name });
            toast.success("Profile updated");
          })}
        >
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Public profile
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Shown on cards, RSVPs, and host tools.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="profile-name"
                className="text-sm font-semibold text-neutral-900"
              >
                Display name
              </label>
              <input
                id="profile-name"
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                {...register("name")}
                autoComplete="username"
              />
              <p className="mt-1.5 text-xs text-neutral-600">
                Letters and numbers only — no spaces or symbols.
              </p>
              {errors.name && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {(errors as { name?: { message?: string } }).name?.message}
                </p>
              )}
            </div>

            {circleSync && (
              <>
                <div>
                  <label
                    htmlFor="profile-dob"
                    className="text-sm font-semibold text-neutral-900"
                  >
                    Date of birth
                  </label>
                  <input
                    id="profile-dob"
                    type="date"
                    readOnly={dobLocked}
                    aria-readonly={dobLocked}
                    className={cn(
                      "mt-2 w-full max-w-xs rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10",
                      dobLocked
                        ? "cursor-not-allowed bg-neutral-100 text-neutral-700"
                        : "bg-neutral-50/80",
                    )}
                    {...register("dob" as const)}
                  />
                  {dobLocked && (
                    <p className="mt-2 text-xs text-neutral-600">
                      Date of birth was saved and can&apos;t be changed here.
                    </p>
                  )}
                  {computedAge != null && (
                    <p className="mt-2 text-sm text-neutral-600">
                      Age shown on meets:{" "}
                      <span className="font-semibold text-neutral-900">
                        {computedAge}
                      </span>
                    </p>
                  )}
                  {(errors as { dob?: { message?: string } }).dob && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {(errors as { dob?: { message?: string } }).dob?.message}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    About you
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Saved to your Circle profile when the API accepts these
                    fields.
                  </p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="profile-bio"
                        className="text-sm font-semibold text-neutral-900"
                      >
                        Bio
                      </label>
                      <textarea
                        id="profile-bio"
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                        placeholder="Short introduction"
                        {...register("bio" as const)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-city"
                        className="text-sm font-semibold text-neutral-900"
                      >
                        City
                      </label>
                      <input
                        id="profile-city"
                        className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                        {...register("city" as const)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-dietary"
                        className="text-sm font-semibold text-neutral-900"
                      >
                        Dietary preference
                      </label>
                      <input
                        id="profile-dietary"
                        className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                        {...register("dietary_preference" as const)}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="profile-emergency-name"
                          className="text-sm font-semibold text-neutral-900"
                        >
                          Emergency contact name
                        </label>
                        <input
                          id="profile-emergency-name"
                          className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                          {...register("emergency_contact_name" as const)}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="profile-emergency-phone"
                          className="text-sm font-semibold text-neutral-900"
                        >
                          Emergency contact phone
                        </label>
                        <input
                          id="profile-emergency-phone"
                          className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
                          {...register("emergency_contact_phone" as const)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {circleSync && fullProfile && (
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 text-sm">
              <h3 className="font-semibold text-neutral-900">Account metadata</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Read-only values from your Circle account.
              </p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-neutral-500">
                    Email verified
                  </dt>
                  <dd className="text-neutral-900">
                    {fullProfile.email_verified === true
                      ? "Yes"
                      : fullProfile.email_verified === false
                        ? "No"
                        : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-neutral-500">
                    Verification tier
                  </dt>
                  <dd className="text-neutral-900">
                    {fullProfile.verification_tier ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-neutral-500">
                    Profile completion score
                  </dt>
                  <dd className="text-neutral-900">
                    {fullProfile.profile_completion_score ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-neutral-500">
                    Profile complete (API)
                  </dt>
                  <dd className="text-neutral-900">
                    {fullProfile.is_profile_complete === true
                      ? "Yes"
                      : fullProfile.is_profile_complete === false
                        ? "No"
                        : "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-neutral-500">
                    Last updated (API)
                  </dt>
                  <dd className="text-neutral-900">
                    {fullProfile.updated_at
                      ? (() => {
                          try {
                            return new Date(
                              fullProfile.updated_at!,
                            ).toLocaleString();
                          } catch {
                            return fullProfile.updated_at;
                          }
                        })()
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="border-t border-neutral-200 pt-8">
            <h2 className="text-base font-semibold text-neutral-900">
              Contact
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {circleSync
                ? "While your account is connected to Circle, email and phone can’t be changed in this app."
                : "Email and phone are used for account security and notifications."}
            </p>
            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Email
                </dt>
                <dd className="mt-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-900">
                  {emailShown}
                </dd>
                <p className="mt-2 text-xs text-neutral-600">
                  {circleSync
                    ? "Gmail / email is fixed for your connected account."
                    : "Shown from your local account."}
                </p>
              </div>
              {circleSync && (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500">
                    <Smartphone className="h-3.5 w-3.5" aria-hidden />
                    Phone
                  </dt>
                  <dd className="mt-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-900">
                    {phoneShown}
                  </dd>
                  <p className="mt-2 text-xs text-neutral-600">
                    {phoneDisplay && phoneDisplay.trim().length > 0
                      ? "Mobile number is fixed for your connected account."
                      : "Link a number by signing in with phone OTP from the login page (same account)."}
                  </p>
                </div>
              )}
            </dl>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
