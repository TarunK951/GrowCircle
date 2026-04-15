"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { listMyPaymentHistory } from "@/lib/circle/paymentsHistoryApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type { CirclePaymentHistoryRow } from "@/lib/circle/types";
import { selectAccessToken } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return JSON.stringify(v);
}

export default function PaymentsPage() {
  const accessToken = useAppSelector(selectAccessToken);
  const [rows, setRows] = useState<CirclePaymentHistoryRow[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken) {
      setLoading(false);
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void listMyPaymentHistory(accessToken, { page: 1, limit: 50 })
      .then(({ data, meta: m }) => {
        if (cancelled) return;
        setRows(data);
        setMeta(m);
      })
      .catch((e) => {
        if (cancelled) return;
        setRows([]);
        const msg =
          e instanceof CircleApiError ? e.message : "Could not load payments";
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!isCircleApiConfigured()) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="font-onest text-2xl font-semibold tracking-tight text-neutral-900">
          Payments
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          Configure <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_CIRCLE_API_BASE</code>{" "}
          to load payment history from the Circle API.
        </p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="font-onest text-2xl font-semibold tracking-tight text-neutral-900">
          Payments
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to see your payment history.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="font-onest text-3xl font-semibold tracking-tight">
          Payment history
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Transactions from the Circle backend (`GET /payments/my/history`).
        </p>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-neutral-600">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-600">
          No payments yet. Book a meet from{" "}
          <Link href="/explore" className="font-semibold text-primary underline">
            Explore
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white/90 shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50/90 text-xs font-bold uppercase tracking-wide text-neutral-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-neutral-800">
                      {r.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">{formatCell(r.amount)}</td>
                    <td className="px-4 py-3 capitalize">
                      {formatCell(r.status)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <p className="mt-4 text-xs text-neutral-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} total
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
