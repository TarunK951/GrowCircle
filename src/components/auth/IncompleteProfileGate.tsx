"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { circleUsernameSchema } from "@/lib/auth/circleUsernameSchema";
import {
  completeProfile,
  getMyProfile,
} from "@/lib/circle/api";
import { formatCircleError } from "@/lib/circle/client";
import { circleProfileToUser } from "@/lib/circle/mappers";
import {
  selectAccessToken,
  selectRefreshToken,
  selectUser,
} from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { store } from "@/lib/store/store";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  username: circleUsernameSchema,
  email: z.string().trim().email(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

const DISMISS_UNTIL_KEY = "growcircle_profile_prompt_dismiss_until";

const inputClass =
  "w-full rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-950/10";

function isDismissedByUser(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(DISMISS_UNTIL_KEY);
  if (!raw) return false;
  const until = Number.parseInt(raw, 10);
  if (Number.isNaN(until)) return false;
  return Date.now() < until;
}

function dismissFor24h() {
  localStorage.setItem(
    DISMISS_UNTIL_KEY,
    String(Date.now() + 24 * 60 * 60 * 1000),
  );
}

/** Modal for Circle users with incomplete profile (e.g. Google OAuth with null phone / §1.3 fields). */
export function IncompleteProfileGate() {
  const pathname = usePathname();
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const user = useAppSelector(selectUser);
  const loginWithCircle = useSessionStore((s) => s.loginWithCircle);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [dobLocked, setDobLocked] = useState(false);

  const onAuthFlow =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth/");

  const needsCompletion =
    accessToken != null &&
    refreshToken != null &&
    user != null &&
    user.isProfileComplete !== true;

  const hydrateForm = useCallback(async () => {
    const token = store.getState().auth.accessToken;
    const reduxUser = store.getState().auth.user;
    if (!token) return;
    try {
      const p = await getMyProfile(token);
      setUsername(
        p.username?.trim() ||
          reduxUser?.name?.replace(/\s+/g, "_").toLowerCase() ||
          "",
      );
      setEmail(p.email?.trim() || reduxUser?.email || "");
      const dobStr = p.dob?.trim() ?? "";
      const dobIso = /^\d{4}-\d{2}-\d{2}/.test(dobStr)
        ? dobStr.slice(0, 10)
        : "";
      setDob(dobIso);
      setEmailLocked(Boolean(p.email?.trim()));
      setDobLocked(/^\d{4}-\d{2}-\d{2}$/.test(dobIso));
    } catch {
      if (reduxUser) {
        setEmail(reduxUser.email ?? "");
        setUsername(
          reduxUser.name?.replace(/\s+/g, "_").toLowerCase() ?? "",
        );
      }
    }
  }, []);

  useEffect(() => {
    if (!needsCompletion || onAuthFlow || isDismissedByUser()) {
      setOpen(false);
      return;
    }
    setOpen(true);
    void hydrateForm();
  }, [needsCompletion, onAuthFlow, hydrateForm]);

  const submit = async () => {
    const parsed = profileSchema.safeParse({ username, email, dob });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    const at = store.getState().auth.accessToken;
    const rt = store.getState().auth.refreshToken;
    if (!at || !rt) {
      toast.error("Session expired — sign in again");
      return;
    }
    setLoading(true);
    try {
      await completeProfile(at, parsed.data);
      const profile = await getMyProfile(at);
      loginWithCircle(circleProfileToUser(profile), {
        accessToken: at,
        refreshToken: rt,
      });
      localStorage.removeItem(DISMISS_UNTIL_KEY);
      toast.success("Profile saved");
      setOpen(false);
    } catch (e) {
      toast.error(formatCircleError(e));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incomplete-profile-title"
    >
      <div
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl",
        )}
      >
        <h2
          id="incomplete-profile-title"
          className="text-lg font-semibold text-neutral-900"
        >
          Finish your profile
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Add your username, email, and date of birth to host meets, join paid
          events, and use your account fully. Email, phone, and date of birth
          can&apos;t be changed after they&apos;re saved — update your display
          name anytime in Profile.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Username
            </label>
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="lettersandnumbers"
            />
            <p className="mt-1.5 text-xs text-neutral-600">
              Letters and numbers only — no spaces or symbols.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Email
            </label>
            <input
              className={cn(
                inputClass,
                emailLocked && "cursor-not-allowed bg-neutral-200/80 text-neutral-700",
              )}
              type="email"
              readOnly={emailLocked}
              aria-readonly={emailLocked}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {emailLocked && (
              <p className="mt-1.5 text-xs text-neutral-600">
                Email can&apos;t be changed once set.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Date of birth
            </label>
            <input
              className={cn(
                inputClass,
                dobLocked && "cursor-not-allowed bg-neutral-200/80 text-neutral-700",
              )}
              type="date"
              readOnly={dobLocked}
              aria-readonly={dobLocked}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            {dobLocked && (
              <p className="mt-1.5 text-xs text-neutral-600">
                Date of birth can&apos;t be changed once saved.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="order-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 sm:order-1"
            disabled={loading}
            onClick={() => {
              dismissFor24h();
              setOpen(false);
              toast.message("We’ll remind you again later.");
            }}
          >
            Remind me later
          </button>
          <button
            type="button"
            className="order-1 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 sm:order-2"
            disabled={loading}
            onClick={() => void submit()}
          >
            {loading ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
