"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getHealth } from "@/lib/circle/healthApi";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/circle/notificationPreferencesApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type { CircleNotificationPreferenceRow } from "@/lib/circle/types";
import { selectAccessToken } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";

export default function SettingsPage() {
  const accessToken = useAppSelector(selectAccessToken);
  const uiPrefs = useSessionStore((s) => s.uiPrefs);
  const setUiPrefs = useSessionStore((s) => s.setUiPrefs);

  const [accountPrefs, setAccountPrefs] = useState<
    CircleNotificationPreferenceRow[] | null
  >(null);
  const [accountPrefsLoading, setAccountPrefsLoading] = useState(false);
  const [accountPrefsSaving, setAccountPrefsSaving] = useState(false);

  const loadAccountPrefs = useCallback(() => {
    if (!isCircleApiConfigured() || !accessToken) {
      setAccountPrefs(null);
      return;
    }
    setAccountPrefsLoading(true);
    void getNotificationPreferences(accessToken)
      .then((rows) => setAccountPrefs(Array.isArray(rows) ? rows : []))
      .catch(() => setAccountPrefs([]))
      .finally(() => setAccountPrefsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    loadAccountPrefs();
  }, [loadAccountPrefs]);

  const saveAccountPrefs = (next: CircleNotificationPreferenceRow[]) => {
    if (!accessToken) return;
    setAccountPrefsSaving(true);
    void updateNotificationPreferences(accessToken, { preferences: next })
      .then(() => {
        setAccountPrefs(next);
        toast.success("Notification preferences saved");
      })
      .catch((e) => {
        const msg =
          e instanceof CircleApiError ? e.message : "Could not save preferences";
        toast.error(msg);
      })
      .finally(() => setAccountPrefsSaving(false));
  };

  const toggleAccountRow = (
    index: number,
    field: "email_enabled" | "push_enabled" | "in_app_enabled",
  ) => {
    if (!accountPrefs) return;
    const row = accountPrefs[index];
    if (!row?.notification_type) return;
    const next = [...accountPrefs];
    next[index] = {
      ...row,
      [field]: !Boolean(row[field]),
    };
    saveAccountPrefs(next);
  };

  const localRow = (
    label: string,
    checked: boolean,
    onChange: (next: boolean) => void,
  ) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-neutral-900">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900/15"
        checked={checked}
        onChange={(e) => {
          onChange(e.target.checked);
          toast.success("Preference saved on this device");
        }}
      />
    </label>
  );

  const accountToggle = (
    label: string,
    checked: boolean,
    onToggle: () => void,
  ) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-neutral-900">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900/15"
        checked={checked}
        onChange={() => onToggle()}
      />
    </label>
  );

  return (
    <div className="w-full max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-neutral-900">
        Manage account notification channels when signed in with Circle, and
        local display options on this device.
      </p>
      {process.env.NODE_ENV === "development" && isCircleApiConfigured() && (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 p-5 text-sm text-neutral-800">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Developer
          </p>
          <button
            type="button"
            className="mt-3 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
            onClick={() => {
              void getHealth()
                .then((h) =>
                  toast.success(
                    typeof h.status === "string" ? h.status : "Backend reachable",
                  ),
                )
                .catch(() => toast.error("Health check failed"));
            }}
          >
            Ping Circle backend (GET /health)
          </button>
        </div>
      )}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
          Safety
        </p>
        <Link
          href="/reports"
          className="mt-3 inline-flex text-sm font-semibold text-neutral-900 underline"
        >
          My reports — submit or view status
        </Link>
      </div>

      {isCircleApiConfigured() && accessToken ? (
        <div className="mt-8 space-y-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-900">
              Account notifications (Circle)
            </p>
            {accountPrefsSaving ? (
              <span className="text-xs text-violet-700">Saving…</span>
            ) : null}
          </div>
          {accountPrefsLoading ? (
            <p className="text-sm text-neutral-600">Loading preferences…</p>
          ) : accountPrefs && accountPrefs.length > 0 ? (
            <ul className="space-y-4">
              {accountPrefs.map((pref, i) => (
                <li
                  key={pref.notification_type}
                  className="rounded-xl border border-violet-100 bg-white/90 p-4"
                >
                  <p className="text-sm font-semibold text-neutral-900">
                    {pref.notification_type.replace(/_/g, " ")}
                  </p>
                  <div className="mt-3 space-y-2">
                    {accountToggle(
                      "Email",
                      Boolean(pref.email_enabled),
                      () => toggleAccountRow(i, "email_enabled"),
                    )}
                    {accountToggle(
                      "Push",
                      Boolean(pref.push_enabled),
                      () => toggleAccountRow(i, "push_enabled"),
                    )}
                    {accountToggle(
                      "In app",
                      Boolean(pref.in_app_enabled),
                      () => toggleAccountRow(i, "in_app_enabled"),
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-600">
              No server notification preferences returned — your backend may use
              a different shape, or defaults apply.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-8 space-y-5 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
          This device only
        </p>
        <p className="text-sm text-neutral-600">
          These toggles are stored in your browser and are not sent to the Circle
          API.
        </p>
        {localRow("Weekly digest email (demo)", uiPrefs.weeklyDigestEmail, (v) =>
          setUiPrefs({ weeklyDigestEmail: v }),
        )}
        {localRow("Push-style reminders for upcoming meets (demo)", uiPrefs.pushRemindersMock, (v) =>
          setUiPrefs({ pushRemindersMock: v }),
        )}
        {localRow("Event recommendations in Explore (demo)", uiPrefs.eventRecommendationsMock, (v) =>
          setUiPrefs({ eventRecommendationsMock: v }),
        )}
        <div className="border-t border-neutral-200 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Appearance
          </p>
          <div className="mt-3 space-y-5">
            {localRow("Show liquid glass hero on home", uiPrefs.showLiquidGlassHero, (v) =>
              setUiPrefs({ showLiquidGlassHero: v }),
            )}
            {localRow("Compact booking & hosting cards", uiPrefs.compactBookingCards, (v) =>
              setUiPrefs({ compactBookingCards: v }),
            )}
            {localRow("Reduce motion (fewer animations)", uiPrefs.reduceMotionUi, (v) =>
              setUiPrefs({ reduceMotionUi: v }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
