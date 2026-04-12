"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/session-store";

export default function SettingsPage() {
  const uiPrefs = useSessionStore((s) => s.uiPrefs);
  const setUiPrefs = useSessionStore((s) => s.setUiPrefs);

  const row = (
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
          toast.success("Preference saved locally");
        }}
      />
    </label>
  );

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-neutral-900">
        Local preferences — not synced to a server.
      </p>
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
      <div className="mt-8 space-y-5 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
          Notifications (mock)
        </p>
        {row("Weekly digest email", uiPrefs.weeklyDigestEmail, (v) =>
          setUiPrefs({ weeklyDigestEmail: v }),
        )}
        {row("Push-style reminders for upcoming meets", uiPrefs.pushRemindersMock, (v) =>
          setUiPrefs({ pushRemindersMock: v }),
        )}
        {row("Event recommendations in Explore", uiPrefs.eventRecommendationsMock, (v) =>
          setUiPrefs({ eventRecommendationsMock: v }),
        )}
        <div className="border-t border-neutral-200 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Appearance
          </p>
          <div className="mt-3 space-y-5">
            {row("Show liquid glass hero on home", uiPrefs.showLiquidGlassHero, (v) =>
              setUiPrefs({ showLiquidGlassHero: v }),
            )}
            {row("Compact booking & hosting cards", uiPrefs.compactBookingCards, (v) =>
              setUiPrefs({ compactBookingCards: v }),
            )}
            {row("Reduce motion (fewer animations)", uiPrefs.reduceMotionUi, (v) =>
              setUiPrefs({ reduceMotionUi: v }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
