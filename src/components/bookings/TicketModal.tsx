"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTicket, getTicketQr } from "@/lib/circle/ticketsApi";
import { CircleApiError } from "@/lib/circle/client";
import type { CircleTicketDetail } from "@/lib/circle/types";

type Props = {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  accessToken: string;
};

export function TicketModal({
  open,
  onClose,
  applicationId,
  accessToken,
}: Props) {
  const [detail, setDetail] = useState<CircleTicketDetail | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !applicationId || !accessToken) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setDetail(null);
      setQrDataUrl(null);
      try {
        const [d, qr] = await Promise.all([
          getTicket(accessToken, applicationId),
          getTicketQr(accessToken, applicationId),
        ]);
        if (!cancelled) {
          setDetail(d);
          setQrDataUrl(qr.qr_code ?? null);
        }
      } catch (e) {
        const msg =
          e instanceof CircleApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not load ticket";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, applicationId, accessToken]);

  if (!open) return null;

  const ev = detail?.event;
  const att = detail?.attendee;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <h3 className="font-onest text-lg font-semibold text-neutral-900">
          Your ticket
        </h3>
        {loading && (
          <p className="mt-4 text-sm text-neutral-600">Loading…</p>
        )}
        {!loading && detail && (
          <div className="mt-4 space-y-4">
            <p className="font-mono text-sm font-semibold text-neutral-900">
              {detail.ticket_id}
            </p>
            {ev?.title && (
              <p className="text-base font-semibold text-neutral-900">
                {ev.title}
              </p>
            )}
            {ev?.event_date && (
              <p className="text-sm text-neutral-700">
                {new Date(ev.event_date).toLocaleString()}
              </p>
            )}
            {ev?.location && (
              <p className="text-sm text-neutral-700">{ev.location}</p>
            )}
            {att?.username && (
              <p className="text-sm text-neutral-700">
                Attendee · @{att.username}
              </p>
            )}
            <p className="text-sm text-neutral-700">
              Status · {detail.status}
            </p>
            <p className="text-sm text-neutral-700">
              Check-in ·{" "}
              {detail.is_checked_in
                ? detail.checked_in_at
                  ? new Date(detail.checked_in_at).toLocaleString()
                  : "Checked in"
                : "Not yet"}
            </p>
            {qrDataUrl && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
                <img
                  src={qrDataUrl}
                  alt="Ticket QR code"
                  className="mx-auto h-48 w-48 object-contain"
                />
                <p className="mt-2 text-xs text-neutral-600">
                  Show this code at entry.
                </p>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          className="mt-6 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
