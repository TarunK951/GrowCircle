"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyReports, submitReport } from "@/lib/circle/reportsApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type {
  CircleReportRow,
  CircleReportTargetType,
} from "@/lib/circle/types";
import { selectAccessToken } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";

export default function ReportsPage() {
  const accessToken = useAppSelector(selectAccessToken);
  const [rows, setRows] = useState<CircleReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);

  const [targetType, setTargetType] =
    useState<CircleReportTargetType>("user");
  const [targetId, setTargetId] = useState("");
  const [eventId, setEventId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    if (!accessToken || !isCircleApiConfigured()) return;
    setLoading(true);
    try {
      const data = await getMyReports(accessToken);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not load reports",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !isCircleApiConfigured()) {
      toast.error("Sign in with Circle to submit a report.");
      return;
    }
    const tid = targetId.trim();
    if (!tid) {
      toast.error("Enter a target id.");
      return;
    }
    const r = reason.trim();
    if (!r) {
      toast.error("Enter a reason.");
      return;
    }
    setSubmitBusy(true);
    try {
      await submitReport(accessToken, {
        target_type: targetType,
        target_id: tid,
        event_id: eventId.trim() || undefined,
        reason: r,
        description: description.trim() || undefined,
      });
      toast.success("Report submitted.");
      setTargetId("");
      setEventId("");
      setReason("");
      setDescription("");
      void load();
    } catch (err) {
      toast.error(
        err instanceof CircleApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not submit",
      );
    } finally {
      setSubmitBusy(false);
    }
  };

  if (!accessToken || !isCircleApiConfigured()) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-2 text-sm text-neutral-900">
          Connect to the Circle API and sign in to submit and view reports.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl text-neutral-900">
      <h1 className="font-onest text-2xl font-semibold tracking-tight sm:text-3xl">
        Reports
      </h1>
      <p className="mt-2 text-sm text-neutral-900">
        Report inappropriate behavior or issues. Submissions are sent to Circle
        for review.
      </p>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Target type
          </label>
          <select
            value={targetType}
            onChange={(e) =>
              setTargetType(e.target.value as CircleReportTargetType)
            }
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="user">User</option>
            <option value="host">Host</option>
            <option value="event">Event</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Target id
          </label>
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            placeholder="User or host or event UUID"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Event id (optional)
          </label>
          <input
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Related event UUID"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Reason
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-900">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 min-h-[100px] w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            rows={4}
          />
        </div>
        <button
          type="submit"
          disabled={submitBusy}
          className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {submitBusy ? "Submitting…" : "Submit report"}
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">Your reports</h2>
        {loading && (
          <p className="mt-4 text-sm text-neutral-900">Loading…</p>
        )}
        {!loading && rows.length === 0 && (
          <p className="mt-4 text-sm text-neutral-900">No reports yet.</p>
        )}
        <ul className="mt-4 max-h-[min(480px,50vh)] space-y-3 overflow-y-auto pr-1">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm"
            >
              <p className="font-semibold text-neutral-900">
                {r.target_type} · {r.status ?? "pending"}
              </p>
              {r.reason && (
                <p className="mt-1 text-neutral-900">{r.reason}</p>
              )}
              <p className="mt-2 text-xs text-neutral-900">
                {r.created_at
                  ? new Date(r.created_at).toLocaleString()
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
