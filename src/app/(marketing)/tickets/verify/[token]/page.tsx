"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { verifyTicketPublic } from "@/lib/circle/ticketsApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type { CircleTicketVerifyPublic } from "@/lib/circle/types";

export default function VerifyTicketPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [data, setData] = useState<CircleTicketVerifyPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Invalid link.");
      return;
    }
    if (!isCircleApiConfigured()) {
      setLoading(false);
      setError("Verification is unavailable (API not configured).");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const d = await verifyTicketPublic(token);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof CircleApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not verify ticket",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Container className="page-shell">
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Ticket verification
        </p>
        <h1 className="mt-2 font-onest text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Verify ticket
        </h1>
        {loading && (
          <p className="mt-6 text-sm text-neutral-600">Checking…</p>
        )}
        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
            {error}
          </div>
        )}
        {!loading && !error && data && (
          <div className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="font-mono text-sm font-semibold text-neutral-900">
              {data.ticket_id}
            </p>
            {data.event?.title && (
              <p className="text-lg font-semibold text-neutral-900">
                {data.event.title}
              </p>
            )}
            {data.attendee?.username && (
              <p className="text-sm text-neutral-700">
                Attendee · @{data.attendee.username}
              </p>
            )}
            <p className="text-sm text-neutral-700">Status · {data.status}</p>
            <p className="text-sm text-neutral-700">
              Check-in ·{" "}
              {data.is_checked_in
                ? data.checked_in_at
                  ? new Date(data.checked_in_at).toLocaleString()
                  : "Checked in"
                : "Not yet"}
            </p>
          </div>
        )}
        <p className="mt-8 text-center text-sm">
          <Link href="/" className="font-semibold text-neutral-900 underline">
            Back to home
          </Link>
        </p>
      </div>
    </Container>
  );
}
