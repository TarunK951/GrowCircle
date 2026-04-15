"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createDispute,
  createSupportTicket,
  listMyDisputes,
  listMySupportTickets,
} from "@/lib/circle/supportApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type {
  CircleDisputeCreateBody,
  CircleDisputeRow,
  CircleSupportTicket,
  CircleSupportTicketCreateBody,
} from "@/lib/circle/types";
import { selectAccessToken } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "payment",
  "refund",
  "event",
  "account",
  "technical",
  "abuse",
  "other",
] as const;

const DISPUTE_TYPES = [
  "uninvite",
  "refund",
  "quality",
  "abuse",
  "fraud",
  "no_show",
  "other",
] as const;

type TabId = "tickets" | "disputes";

export default function SupportPage() {
  const accessToken = useAppSelector(selectAccessToken);
  const [tab, setTab] = useState<TabId>("tickets");
  const [tickets, setTickets] = useState<CircleSupportTicket[]>([]);
  const [disputes, setDisputes] = useState<CircleDisputeRow[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [form, setForm] = useState<CircleSupportTicketCreateBody>({
    category: "technical",
    subject: "",
    description: "",
    priority: "medium",
  });
  const [disputeForm, setDisputeForm] = useState<CircleDisputeCreateBody>({
    respondent_id: "",
    type: "other",
    description: "",
  });

  const loadTickets = () => {
    if (!accessToken || !isCircleApiConfigured()) return;
    setLoadingTickets(true);
    void listMySupportTickets(accessToken, { page: 1, limit: 50 })
      .then(({ data }) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setLoadingTickets(false));
  };

  const loadDisputes = () => {
    if (!accessToken || !isCircleApiConfigured()) return;
    setLoadingDisputes(true);
    void listMyDisputes(accessToken, { page: 1, limit: 50 })
      .then(({ data }) => setDisputes(Array.isArray(data) ? data : []))
      .catch(() => setDisputes([]))
      .finally(() => setLoadingDisputes(false));
  };

  useEffect(() => {
    loadTickets();
  }, [accessToken]);

  useEffect(() => {
    if (tab === "disputes") loadDisputes();
  }, [tab, accessToken]);

  const onSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !form.subject.trim() || !form.description.trim()) {
      toast.error("Subject and description are required.");
      return;
    }
    setSubmitting(true);
    void createSupportTicket(accessToken, {
      ...form,
      subject: form.subject.trim(),
      description: form.description.trim(),
    })
      .then(() => {
        toast.success("Ticket submitted");
        setForm({
          category: "technical",
          subject: "",
          description: "",
          priority: "medium",
        });
        loadTickets();
      })
      .catch((err) => {
        toast.error(
          err instanceof CircleApiError
            ? err.message
            : "Could not create ticket",
        );
      })
      .finally(() => setSubmitting(false));
  };

  const onSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !accessToken ||
      !disputeForm.respondent_id.trim() ||
      !disputeForm.description.trim()
    ) {
      toast.error("Respondent ID and description are required.");
      return;
    }
    setDisputeSubmitting(true);
    void createDispute(accessToken, {
      ...disputeForm,
      respondent_id: disputeForm.respondent_id.trim(),
      description: disputeForm.description.trim(),
      event_id: disputeForm.event_id?.trim() || undefined,
    })
      .then(() => {
        toast.success("Dispute submitted");
        setDisputeForm({
          respondent_id: "",
          type: "other",
          description: "",
        });
        loadDisputes();
      })
      .catch((err) => {
        toast.error(
          err instanceof CircleApiError
            ? err.message
            : "Could not create dispute",
        );
      })
      .finally(() => setDisputeSubmitting(false));
  };

  if (!isCircleApiConfigured()) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-onest text-2xl font-semibold">Support</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Set{" "}
          <code className="rounded bg-neutral-100 px-1">
            NEXT_PUBLIC_CIRCLE_API_BASE
          </code>{" "}
          to use support tickets.
        </p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-onest text-2xl font-semibold">Support</h1>
        <p className="mt-2 text-sm text-neutral-600">Sign in to contact support.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 text-neutral-900">
      <div>
        <h1 className="font-onest text-3xl font-semibold tracking-tight">
          Support
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tickets for general help; disputes for escalations about users or
          events.
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "tickets"}
          onClick={() => setTab("tickets")}
          className={cn(
            "min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition",
            tab === "tickets"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          Tickets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "disputes"}
          onClick={() => setTab("disputes")}
          className={cn(
            "min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition",
            tab === "disputes"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          Disputes
        </button>
      </div>

      {tab === "tickets" && (
        <>
          <form
            onSubmit={onSubmitTicket}
            className="rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              New ticket
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Category
                <select
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target
                        .value as CircleSupportTicketCreateBody["category"],
                    }))
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Priority
                <select
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                  value={form.priority ?? "medium"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value }))
                  }
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium">
              Subject
              <input
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                maxLength={200}
                required
              />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Description
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-xl border border-neutral-200 px-3 py-2"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                required
              />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Related event ID (optional)
              <input
                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 font-mono text-sm"
                value={form.event_id ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    event_id: e.target.value.trim() || undefined,
                  }))
                }
                placeholder="uuid"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Submit ticket"}
            </button>
          </form>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Your tickets
            </p>
            {loadingTickets ? (
              <p className="mt-4 text-sm text-neutral-600">Loading…</p>
            ) : tickets.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-600">No tickets yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {tickets.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm"
                  >
                    <p className="font-semibold text-neutral-900">{t.subject}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {t.category} · {t.status ?? "—"} ·{" "}
                      {t.created_at
                        ? new Date(t.created_at).toLocaleString()
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === "disputes" && (
        <>
          <form
            onSubmit={onSubmitDispute}
            className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-amber-950">
              New dispute
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Type
                <select
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2"
                  value={disputeForm.type}
                  onChange={(e) =>
                    setDisputeForm((f) => ({
                      ...f,
                      type: e.target.value,
                    }))
                  }
                >
                  {DISPUTE_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Respondent user ID
                <input
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm"
                  value={disputeForm.respondent_id}
                  onChange={(e) =>
                    setDisputeForm((f) => ({
                      ...f,
                      respondent_id: e.target.value,
                    }))
                  }
                  required
                  placeholder="UUID"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium">
              Description
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2"
                value={disputeForm.description}
                onChange={(e) =>
                  setDisputeForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                required
              />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Related event ID (optional)
              <input
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm"
                value={disputeForm.event_id ?? ""}
                onChange={(e) =>
                  setDisputeForm((f) => ({
                    ...f,
                    event_id: e.target.value.trim() || undefined,
                  }))
                }
              />
            </label>
            <button
              type="submit"
              disabled={disputeSubmitting}
              className="mt-6 rounded-full bg-amber-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
            >
              {disputeSubmitting ? "Sending…" : "Submit dispute"}
            </button>
          </form>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Your disputes
            </p>
            {loadingDisputes ? (
              <p className="mt-4 text-sm text-neutral-600">Loading…</p>
            ) : disputes.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-600">No disputes yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {disputes.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm"
                  >
                    <p className="font-semibold text-neutral-900">
                      {d.type ?? "Dispute"} · {d.status ?? "—"}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm text-neutral-700">
                      {d.description}
                    </p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {d.created_at
                        ? new Date(d.created_at).toLocaleString()
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
