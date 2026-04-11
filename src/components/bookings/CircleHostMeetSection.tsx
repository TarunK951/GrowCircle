"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getEventCheckinStatus,
  listEventApplications,
  selectEventApplications,
  uninviteApplication,
  verifyCheckinOtp,
} from "@/lib/circle/api";
import { CircleApiError } from "@/lib/circle/client";
import type {
  CheckinEventStatusData,
  CircleEventApplicationRow,
  CircleListMeta,
} from "@/lib/circle/types";

function humanize(s: string) {
  return s.replace(/_/g, " ");
}

export function CircleHostMeetSection({
  eventId,
  accessToken,
  active,
}: {
  eventId: string;
  accessToken: string;
  active: boolean;
}) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState<CircleEventApplicationRow[]>([]);
  const [meta, setMeta] = useState<CircleListMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checkin, setCheckin] = useState<CheckinEventStatusData | null>(null);
  const [verifyOtp, setVerifyOtp] = useState<Record<string, string>>({});
  const [uninviteId, setUninviteId] = useState<string | null>(null);
  const [uninviteReason, setUninviteReason] = useState("");
  const [busy, setBusy] = useState(false);

  const limit = 20;

  const loadApplications = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const { data, meta: m } = await listEventApplications(
        accessToken,
        eventId,
        {
          page,
          limit,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      );
      setRows(data);
      setMeta(m);
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : "Could not load applications",
      );
    } finally {
      setLoading(false);
    }
  }, [active, accessToken, eventId, page, statusFilter]);

  const loadCheckin = useCallback(async () => {
    if (!active) return;
    try {
      const d = await getEventCheckinStatus(accessToken, eventId);
      setCheckin(d);
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : "Could not load check-in status",
      );
    }
  }, [active, accessToken, eventId]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    void loadCheckin();
  }, [loadCheckin]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runSelect = async () => {
    if (selected.size === 0) {
      toast.error("Choose at least one application.");
      return;
    }
    setBusy(true);
    try {
      const res = await selectEventApplications(accessToken, eventId, {
        application_ids: Array.from(selected),
      });
      toast.success(
        `Processed: ${res.selected} selected, ${res.rejected} rejected.`,
      );
      setSelected(new Set());
      await loadApplications();
      await loadCheckin();
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : "Could not finalize selection",
      );
    } finally {
      setBusy(false);
    }
  };

  const runUninvite = async () => {
    if (!uninviteId) return;
    const reason = uninviteReason.trim();
    if (!reason) {
      toast.error("Enter a reason.");
      return;
    }
    setBusy(true);
    try {
      await uninviteApplication(accessToken, uninviteId, { reason });
      toast.success("Attendee uninvited.");
      setUninviteId(null);
      setUninviteReason("");
      await loadApplications();
      await loadCheckin();
    } catch (e) {
      toast.error(
        e instanceof CircleApiError ? e.message : "Could not uninvite",
      );
    } finally {
      setBusy(false);
    }
  };

  const runVerify = async (applicationId: string) => {
    const otp = verifyOtp[applicationId]?.trim();
    if (!otp) {
      toast.error("Enter the guest’s check-in code.");
      return;
    }
    setBusy(true);
    try {
      await verifyCheckinOtp(accessToken, applicationId, { otp });
      toast.success("Checked in.");
      setVerifyOtp((o) => ({ ...o, [applicationId]: "" }));
      await loadCheckin();
      await loadApplications();
    } catch (e) {
      toast.error(
        e instanceof CircleApiError ? e.message : "Verification failed",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!active) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-violet-900">
          Applications (Circle API)
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-neutral-900">
            Status filter
            <select
              className="liquid-glass-input mt-1 block text-sm text-neutral-900"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending_payment">Pending payment</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="selected">Selected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
            onClick={() => void runSelect()}
          >
            {busy ? "Working…" : "Confirm selection"}
          </button>
        </div>
        {loading && (
          <p className="mt-3 text-sm text-neutral-600">Loading…</p>
        )}
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-violet-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-neutral-400"
                  checked={selected.has(row.id)}
                  onChange={() => toggleSelect(row.id)}
                  aria-label="Select application"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900">
                    {row.user?.username ?? row.user?.email ?? "Guest"}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-800">
                    {humanize(row.status)}
                  </p>
                  {row.payment?.amount && (
                    <p className="text-sm text-neutral-700">
                      {row.payment.amount} · {row.payment.status}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="self-start text-xs font-semibold text-red-800 hover:underline sm:self-center"
                onClick={() => setUninviteId(row.id)}
              >
                Uninvite
              </button>
            </li>
          ))}
        </ul>
        {meta && meta.totalPages > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-neutral-700">
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </span>
            <button
              type="button"
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold disabled:opacity-40"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
          Check-in
        </p>
        {checkin && (
          <p className="mt-2 text-sm text-neutral-800">
            {checkin.checkedIn} checked in · {checkin.pending} pending ·{" "}
            {checkin.total} total
          </p>
        )}
        <ul className="mt-3 space-y-2">
          {checkin?.attendees?.map((a) => (
            <li
              key={a.applicationId}
              className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-neutral-900">
                  @{a.user.username ?? a.user.id}
                </p>
                <p className="text-xs text-neutral-600">
                  {a.isCheckedIn
                    ? `Checked in ${a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : ""}`
                    : "Not checked in"}
                </p>
              </div>
              {!a.isCheckedIn && (
                <div className="flex flex-wrap items-center gap-1">
                  <input
                    placeholder="OTP"
                    className="liquid-glass-input w-28 py-1 text-xs text-neutral-900"
                    value={verifyOtp[a.applicationId] ?? ""}
                    onChange={(e) =>
                      setVerifyOtp((o) => ({
                        ...o,
                        [a.applicationId]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                    onClick={() => void runVerify(a.applicationId)}
                  >
                    Verify
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-violet-800 hover:underline"
          onClick={() => void loadCheckin()}
        >
          Refresh check-in
        </button>
      </div>

      {uninviteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close"
            onClick={() => {
              setUninviteId(null);
              setUninviteReason("");
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="font-onest text-lg font-semibold text-neutral-900">
              Uninvite guest
            </h3>
            <label className="mt-4 block text-xs font-semibold text-neutral-900">
              Reason
              <textarea
                className="liquid-glass-input mt-1 min-h-[88px] w-full text-sm text-neutral-900"
                value={uninviteReason}
                onChange={(e) => setUninviteReason(e.target.value)}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                disabled={busy}
                onClick={() => void runUninvite()}
              >
                Submit
              </button>
              <button
                type="button"
                className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
                onClick={() => {
                  setUninviteId(null);
                  setUninviteReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
