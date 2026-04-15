"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getHostDashboard,
  getHostOnboarding,
  getHostProfile,
  getHostRevenue,
  getPublicHostProfile,
  updateHostProfile,
} from "@/lib/circle/hostProfileApi";
import { getHostRatingSummary } from "@/lib/circle/ratingsApi";
import {
  createPayoutAccount,
  deletePayoutAccount,
  listPayoutAccounts,
  setPrimaryPayoutAccount,
} from "@/lib/circle/payoutAccountsApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type {
  CircleHostDashboardData,
  CircleHostProfile,
  CirclePayoutAccount,
  CirclePayoutAccountCreateBody,
  CircleRatingHostSummary,
} from "@/lib/circle/types";
import { selectAccessToken, selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";

export default function HostProfilePage() {
  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);
  const [publicRating, setPublicRating] =
    useState<CircleRatingHostSummary | null>(null);
  const [publicCard, setPublicCard] = useState<{
    eventCount?: number;
  } | null>(null);
  const [profile, setProfile] = useState<CircleHostProfile | null>(null);
  /** True until first load attempt finishes */
  const [initialLoad, setInitialLoad] = useState(true);
  const [dash, setDash] = useState<CircleHostDashboardData | null>(null);
  const [onboarding, setOnboarding] = useState<Awaited<
    ReturnType<typeof getHostOnboarding>
  > | null>(null);
  const [revenue, setRevenue] = useState<{ date: string; revenue: number }[]>(
    [],
  );
  const [accounts, setAccounts] = useState<CirclePayoutAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payoutForm, setPayoutForm] = useState<CirclePayoutAccountCreateBody>({
    account_type: "upi",
    upi_id: "",
  });

  const loadAll = () => {
    if (!accessToken || !isCircleApiConfigured()) return;
    Promise.all([
      getHostProfile(accessToken).catch(() => null),
      getHostDashboard(accessToken).catch(() => null),
      getHostOnboarding(accessToken).catch(() => null),
      getHostRevenue(accessToken, 30).catch(() => []),
      listPayoutAccounts(accessToken).catch(() => []),
    ])
      .then(([p, d, o, rev, acc]) => {
        setProfile(p ?? {});
        setDash(d);
        setOnboarding(o);
        setRevenue(Array.isArray(rev) ? rev : []);
        setAccounts(Array.isArray(acc) ? acc : []);
      })
      .finally(() => setInitialLoad(false));
  };

  useEffect(() => {
    loadAll();
  }, [accessToken]);

  useEffect(() => {
    if (!user?.id || !isCircleApiConfigured()) {
      setPublicRating(null);
      setPublicCard(null);
      return;
    }
    let cancelled = false;
    void Promise.all([
      getHostRatingSummary(user.id).catch(() => null),
      getPublicHostProfile(user.id).catch(() => null),
    ]).then(([sum, card]) => {
      if (cancelled) return;
      setPublicRating(sum);
      setPublicCard(
        card && typeof card === "object"
          ? { eventCount: card.eventCount }
          : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !profile) return;
    setSaving(true);
    void updateHostProfile(accessToken, profile)
      .then((p) => {
        setProfile(p);
        toast.success("Host profile saved");
      })
      .catch((err) => {
        const msg =
          err instanceof CircleApiError ? err.message : "Could not save profile";
        toast.error(msg);
      })
      .finally(() => setSaving(false));
  };

  const addPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setPayoutBusy(true);
    const body: CirclePayoutAccountCreateBody =
      payoutForm.account_type === "bank"
        ? {
            account_type: "bank",
            bank_name: payoutForm.bank_name,
            account_number: payoutForm.account_number,
            ifsc_code: payoutForm.ifsc_code,
            account_holder_name: payoutForm.account_holder_name,
          }
        : { account_type: "upi", upi_id: payoutForm.upi_id?.trim() };
    void createPayoutAccount(accessToken, body)
      .then(() => {
        toast.success("Payout account added");
        setPayoutForm({ account_type: "upi", upi_id: "" });
        loadAll();
      })
      .catch((err) => {
        toast.error(
          err instanceof CircleApiError ? err.message : "Could not add account",
        );
      })
      .finally(() => setPayoutBusy(false));
  };

  if (!isCircleApiConfigured()) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-onest text-2xl font-semibold">Host profile</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Configure the Circle API base URL to manage your host profile.
        </p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-onest text-2xl font-semibold">Host profile</h1>
        <p className="mt-2 text-sm text-neutral-600">Sign in to continue.</p>
      </div>
    );
  }

  if (initialLoad) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-neutral-600">Loading host profile…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 text-neutral-900">
      <div>
        <h1 className="font-onest text-3xl font-semibold tracking-tight">
          Host profile
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Public host details, performance, and payout accounts.
        </p>
      </div>

      {publicRating &&
      (publicRating.averageRating != null || publicRating.totalRatings != null) ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-5 py-4 text-sm text-emerald-950">
          <p className="text-xs font-bold uppercase tracking-wider">
            Public rating (Circle)
          </p>
          <p className="mt-2 font-onest text-2xl font-semibold">
            {publicRating.averageRating != null
              ? `${Number(publicRating.averageRating).toFixed(1)} / 5`
              : "—"}
            <span className="ml-2 text-base font-normal text-emerald-800">
              {publicRating.totalRatings != null
                ? `(${publicRating.totalRatings} reviews)`
                : null}
            </span>
          </p>
          {publicCard?.eventCount != null ? (
            <p className="mt-1 text-xs text-emerald-800">
              {publicCard.eventCount} events on public profile
            </p>
          ) : null}
        </div>
      ) : null}

      {onboarding && !onboarding.isComplete ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          Onboarding: step {onboarding.currentStep ?? "—"} ·{" "}
          {onboarding.completionPercentage ?? 0}% complete
          {onboarding.missing && onboarding.missing.length > 0
            ? ` · Missing: ${onboarding.missing.join(", ")}`
            : null}
        </div>
      ) : null}

      {dash ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total events", dash.totalEvents],
            ["Upcoming", dash.upcomingEvents],
            ["Net income", dash.netIncome],
            ["Avg rating", dash.averageRating],
          ].map(([label, val]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                {label}
              </p>
              <p className="mt-2 font-onest text-2xl font-semibold">
                {val ?? "—"}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={saveProfile}
        className="rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm"
      >
        <p className="text-xs font-bold uppercase tracking-wider">Profile</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Display name
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={profile?.display_name ?? ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...(p ?? {}),
                  display_name: e.target.value,
                }))
              }
            />
          </label>
          <label className="text-sm font-medium">
            City
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={profile?.city ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...(p ?? {}), city: e.target.value }))
              }
            />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium">
          Bio
          <textarea
            className="mt-1 min-h-[100px] w-full rounded-xl border border-neutral-200 px-3 py-2"
            value={profile?.bio ?? ""}
            onChange={(e) =>
              setProfile((p) => ({ ...(p ?? {}), bio: e.target.value }))
            }
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ["social_instagram", "Instagram"],
              ["social_twitter", "Twitter / X"],
              ["social_youtube", "YouTube"],
              ["social_website", "Website"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm font-medium">
              {label}
              <input
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                value={(profile?.[key] as string) ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...(p ?? {}), [key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      {revenue.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider">
            Revenue (30 days)
          </p>
          <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto text-sm">
            {revenue.slice(-14).map((pt) => (
              <li
                key={pt.date}
                className="flex justify-between border-b border-neutral-100 py-1"
              >
                <span className="text-neutral-600">{pt.date}</span>
                <span className="font-medium">{pt.revenue}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-900">
          Payout accounts
        </p>
        <ul className="mt-4 space-y-2">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white/90 px-3 py-2 text-sm"
            >
              <span>
                {a.account_type}
                {a.upi_id ? ` · ${a.upi_id}` : ""}
                {a.bank_name ? ` · ${a.bank_name}` : ""}
                {a.is_primary ? (
                  <span className="ml-2 text-xs font-bold text-violet-700">
                    Primary
                  </span>
                ) : null}
              </span>
              <span className="flex gap-2">
                {!a.is_primary ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-violet-800 underline"
                    onClick={() => {
                      if (!accessToken) return;
                      setPayoutBusy(true);
                      void setPrimaryPayoutAccount(accessToken, a.id)
                        .then(() => {
                          toast.success("Primary updated");
                          loadAll();
                        })
                        .catch(() => toast.error("Could not set primary"))
                        .finally(() => setPayoutBusy(false));
                    }}
                  >
                    Set primary
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-xs font-semibold text-red-700 underline"
                  onClick={() => {
                    if (!accessToken) return;
                    setPayoutBusy(true);
                    void deletePayoutAccount(accessToken, a.id)
                      .then(() => {
                        toast.success("Removed");
                        loadAll();
                      })
                      .catch(() => toast.error("Could not remove"))
                      .finally(() => setPayoutBusy(false));
                  }}
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>

        <form onSubmit={addPayout} className="mt-6 space-y-4 border-t border-violet-100 pt-6">
          <label className="text-sm font-medium">
            Account type
            <select
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={payoutForm.account_type}
              onChange={(e) =>
                setPayoutForm((f) => ({
                  ...f,
                  account_type: e.target.value as "bank" | "upi",
                }))
              }
            >
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
            </select>
          </label>
          {payoutForm.account_type === "upi" ? (
            <label className="block text-sm font-medium">
              UPI ID
              <input
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                value={payoutForm.upi_id ?? ""}
                onChange={(e) =>
                  setPayoutForm((f) => ({ ...f, upi_id: e.target.value }))
                }
                required
              />
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Bank name
                <input
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  value={payoutForm.bank_name ?? ""}
                  onChange={(e) =>
                    setPayoutForm((f) => ({ ...f, bank_name: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm font-medium">
                Account number
                <input
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  value={payoutForm.account_number ?? ""}
                  onChange={(e) =>
                    setPayoutForm((f) => ({
                      ...f,
                      account_number: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-medium">
                IFSC
                <input
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  value={payoutForm.ifsc_code ?? ""}
                  onChange={(e) =>
                    setPayoutForm((f) => ({ ...f, ifsc_code: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm font-medium">
                Account holder
                <input
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  value={payoutForm.account_holder_name ?? ""}
                  onChange={(e) =>
                    setPayoutForm((f) => ({
                      ...f,
                      account_holder_name: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
          )}
          <button
            type="submit"
            disabled={payoutBusy}
            className="rounded-full bg-violet-900 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {payoutBusy ? "Working…" : "Add payout account"}
          </button>
        </form>
      </div>
    </div>
  );
}
