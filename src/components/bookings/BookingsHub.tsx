"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  acceptWaitlistOffer,
  cancelApplication,
  generateCheckinOtp,
  getMyApplications,
  getPayment,
  getWaitlistPosition,
} from "@/lib/circle/api";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { CircleHostMeetSection } from "@/components/bookings/CircleHostMeetSection";
import { TicketModal } from "@/components/bookings/TicketModal";
import { downloadApplicationInvoice } from "@/lib/circle/invoicesApi";
import type { CircleMyApplication, CirclePaymentDetails } from "@/lib/circle/types";
import {
  getEventFromCatalog,
  mergeEventCatalog,
} from "@/lib/eventsCatalog";
import { openRazorpayFromPayload } from "@/lib/razorpay/loadCheckout";
import { lookupUser } from "@/lib/userLookup";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import type { Booking, MeetEvent } from "@/lib/types";

type Tab = "guest" | "host";

function copyText(label: string, text: string) {
  void navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function statusLabel(s: Booking["status"]) {
  switch (s) {
    case "pending":
      return "Applied";
    case "confirmed":
      return "Confirmed";
    case "attended":
      return "Attended";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}

function BookingStatusBadge({ status }: { status: Booking["status"] }) {
  const label = statusLabel(status);
  return (
    <span className="inline-flex shrink-0 rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
      {label}
    </span>
  );
}

function humanizeCircleStatus(s: string) {
  const x = s.replace(/_/g, " ");
  return x.charAt(0).toUpperCase() + x.slice(1);
}

function CircleStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-violet-700 bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-900">
      {humanizeCircleStatus(status)}
    </span>
  );
}

function PaymentDetailsModal({
  paymentId,
  accessToken,
  open,
  onClose,
}: {
  paymentId: string | null;
  accessToken: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<CirclePaymentDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !paymentId || !accessToken) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setData(null);
      try {
        const d = await getPayment(accessToken, paymentId);
        if (!cancelled) setData(d);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load payment");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, paymentId, accessToken]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <h3 className="font-onest text-lg font-semibold text-neutral-900">
          Payment details
        </h3>
        {loading && (
          <p className="mt-4 text-sm text-neutral-600">Loading…</p>
        )}
        {!loading && data && (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Amount</dt>
              <dd className="font-semibold text-neutral-900">{data.amount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-600">Status</dt>
              <dd className="font-semibold text-neutral-900">{data.status}</dd>
            </div>
            {data.razorpay_order_id && (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Order</dt>
                <dd className="break-all font-mono text-xs text-neutral-900">
                  {data.razorpay_order_id}
                </dd>
              </div>
            )}
            {data.razorpay_payment_id && (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Payment id</dt>
                <dd className="break-all font-mono text-xs text-neutral-900">
                  {data.razorpay_payment_id}
                </dd>
              </div>
            )}
            {data.paid_at && (
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Paid at</dt>
                <dd className="text-neutral-900">
                  {new Date(data.paid_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
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

function CircleGuestApplicationCard({
  app,
  accessToken,
  hostedEvents,
  circleCatalogEvents,
  onRefresh,
  compactBookingCards,
}: {
  app: CircleMyApplication;
  accessToken: string;
  hostedEvents: MeetEvent[];
  circleCatalogEvents: MeetEvent[];
  onRefresh: () => void;
  compactBookingCards: boolean;
}) {
  const eventId = app.event?.id ?? "";
  const ev = eventId
    ? getEventFromCatalog(eventId, hostedEvents, circleCatalogEvents)
    : null;
  const title = app.event?.title ?? "Event";
  const hostName = app.event?.host?.username;
  const image =
    ev?.image ??
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80";

  const [waitInfo, setWaitInfo] = useState<string | null>(null);
  const [otpState, setOtpState] = useState<{
    otp: string;
    expiresAt: number;
    hint: string;
  } | null>(null);
  const [otpSecsLeft, setOtpSecsLeft] = useState(0);
  const [paymentModal, setPaymentModal] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [receiptBusy, setReceiptBusy] = useState(false);

  useEffect(() => {
    if (!otpState) return;
    const tick = () => {
      setOtpSecsLeft(
        Math.max(0, Math.floor((otpState.expiresAt - Date.now()) / 1000)),
      );
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [otpState]);

  const secsLeft = otpState ? otpSecsLeft : 0;

  const canCancel =
    app.status !== "cancelled" &&
    !["attended", "checked_in"].includes(app.status);

  const showCheckinOtp = ["paid", "selected", "confirmed"].includes(
    app.status,
  );

  const payId =
    app.payment && "id" in app.payment && app.payment.id
      ? String(app.payment.id)
      : null;

  const canViewTicket =
    isCircleApiConfigured() &&
    (Boolean(app.ticket_id) ||
      ["selected", "paid", "confirmed", "attended", "checked_in"].includes(
        app.status,
      ));

  const runDownloadReceipt = async () => {
    if (!payId) return;
    setReceiptBusy(true);
    try {
      const blob = await downloadApplicationInvoice(accessToken, app.id);
      triggerBlobDownload(blob, `receipt-${app.id}.pdf`);
      toast.success("Receipt downloaded.");
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not download receipt",
      );
    } finally {
      setReceiptBusy(false);
    }
  };

  const runAcceptOffer = async () => {
    try {
      const data = await acceptWaitlistOffer(accessToken, app.id);
      const pay = data.payment;
      if (pay?.key && pay.orderId != null && pay.amount != null) {
        await openRazorpayFromPayload({
          payload: pay,
          title: title,
          onPaid: () =>
            toast.success("Payment submitted — refreshing your applications."),
        });
      } else {
        toast.success("Offer accepted.");
      }
      onRefresh();
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not accept offer",
      );
    }
  };

  const runCancel = async () => {
    try {
      const data = await cancelApplication(accessToken, app.id);
      const r = data.refund;
      if (r?.eligible) {
        toast.success(
          r.reason ??
            `Refund ${r.percentage ?? 0}% (${r.amount ?? ""})`,
        );
      } else {
        toast.success("Application cancelled.");
      }
      onRefresh();
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not cancel",
      );
    }
  };

  const refreshWaitlist = async () => {
    try {
      const w = await getWaitlistPosition(accessToken, app.id);
      setWaitInfo(
        `Position ${w.position} of ${w.totalWaitlisted} (${humanizeCircleStatus(w.status)})`,
      );
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : "Could not load waitlist position",
      );
    }
  };

  const genOtp = async () => {
    try {
      const d = await generateCheckinOtp(accessToken, app.id);
      setOtpState({
        otp: d.otp,
        expiresAt: Date.now() + d.expiresInSeconds * 1000,
        hint: d.message,
      });
      toast.success("Check-in code ready.");
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : "Could not generate code",
      );
    }
  };

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm",
        compactBookingCards && "border-violet-100",
      )}
    >
      <PaymentDetailsModal
        paymentId={payId}
        accessToken={accessToken}
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
      />
      <TicketModal
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        applicationId={app.id}
        accessToken={accessToken}
      />
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div className="relative h-36 w-full shrink-0 bg-neutral-100 sm:w-40 md:w-44">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width:640px) 100vw, 176px"
            className="object-cover"
          />
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5",
            compactBookingCards && "gap-3 p-3 sm:p-4",
          )}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CircleStatusBadge status={app.status} />
              {app.ticket_id && (
                <span className="text-xs font-mono font-semibold text-neutral-800">
                  Ticket {app.ticket_id}
                </span>
              )}
            </div>
            <Link
              href={eventId ? `/event/${eventId}` : "#"}
              className="mt-2 block font-onest text-lg font-semibold text-neutral-900 hover:text-primary hover:underline"
            >
              {title}
            </Link>
            {hostName && (
              <p className="mt-1 text-sm text-neutral-700">Host · @{hostName}</p>
            )}
            {app.payment?.amount && (
              <p className="mt-1 text-sm font-medium text-neutral-800">
                Paid {app.payment.amount} · {app.payment.status ?? ""}
              </p>
            )}
            {waitInfo && (
              <p className="mt-2 text-sm text-violet-900">{waitInfo}</p>
            )}
            {otpState && secsLeft > 0 && (
              <p className="mt-3 font-mono text-lg font-semibold tracking-widest text-neutral-900">
                {otpState.otp}
                <span className="ml-3 text-xs font-sans font-normal text-neutral-600">
                  expires in {secsLeft}s
                </span>
              </p>
            )}
            {otpState && secsLeft <= 0 && (
              <p className="mt-2 text-sm text-amber-800">Code expired.</p>
            )}
            {otpState?.hint && (
              <p className="mt-1 text-xs text-neutral-600">{otpState.hint}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {eventId && (
              <Link
                href={`/event/${eventId}`}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
              >
                View event
              </Link>
            )}
            {payId && (
              <button
                type="button"
                className="rounded-full border border-violet-300 bg-white px-4 py-2 text-xs font-semibold text-violet-900 hover:bg-violet-50"
                onClick={() => setPaymentModal(true)}
              >
                View payment
              </button>
            )}
            {canViewTicket && (
              <button
                type="button"
                className="rounded-full border border-neutral-900 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                onClick={() => setTicketOpen(true)}
              >
                View ticket
              </button>
            )}
            {payId && isCircleApiConfigured() && (
              <button
                type="button"
                disabled={receiptBusy}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-60"
                onClick={() => void runDownloadReceipt()}
              >
                {receiptBusy ? "Downloading…" : "Download receipt"}
              </button>
            )}
            {app.status === "waitlisted" && (
              <button
                type="button"
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                onClick={() => void refreshWaitlist()}
              >
                Waitlist position
              </button>
            )}
            {app.status === "offer_pending" && (
              <button
                type="button"
                className="rounded-full border border-violet-600 bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                onClick={() => void runAcceptOffer()}
              >
                Complete payment
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                onClick={() => void runCancel()}
              >
                Cancel
              </button>
            )}
            {showCheckinOtp && (
              <button
                type="button"
                className="rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
                onClick={() => void genOtp()}
              >
                {otpState ? "New check-in code" : "Show check-in code"}
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function BookingsHub() {
  const user = useSessionStore((s) => s.user);
  const accessToken = useSessionStore((s) => s.accessToken);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const cancelBooking = useSessionStore((s) => s.cancelBooking);
  const refundBooking = useSessionStore((s) => s.refundBooking);
  const updateHostedEvent = useSessionStore((s) => s.updateHostedEvent);
  const deleteHostedEvent = useSessionStore((s) => s.deleteHostedEvent);
  const approveBooking = useSessionStore((s) => s.approveBooking);
  const removeGuestBooking = useSessionStore((s) => s.removeGuestBooking);
  const markAttendance = useSessionStore((s) => s.markAttendance);
  const compactBookingCards = useSessionStore(
    (s) => s.uiPrefs.compactBookingCards,
  );

  const [tab, setTab] = useState<Tab>("guest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [circleApps, setCircleApps] = useState<CircleMyApplication[]>([]);
  const [circleLoading, setCircleLoading] = useState(false);

  const loadCircleApps = useCallback(async () => {
    if (!accessToken || !isCircleApiConfigured()) return;
    setCircleLoading(true);
    try {
      const data = await getMyApplications(accessToken);
      setCircleApps(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : "Could not load Circle applications",
      );
    } finally {
      setCircleLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadCircleApps();
  }, [loadCircleApps]);

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents, circleCatalogEvents),
    [hostedEvents, circleCatalogEvents],
  );

  const myHosting = useMemo(() => {
    if (!user) return [];
    return catalog.filter((e) => e.hostUserId === user.id);
  }, [catalog, user]);

  const myBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter((b) => b.userId === user.id);
  }, [bookings, user]);

  const mockGuestBookings = useMemo(() => {
    return myBookings.filter((b) => {
      const ev = getEventFromCatalog(
        b.eventId,
        hostedEvents,
        circleCatalogEvents,
      );
      if (ev?.cityId === "circle") return false;
      return true;
    });
  }, [myBookings, hostedEvents, circleCatalogEvents]);

  const showCircleGuest =
    isCircleApiConfigured() && Boolean(accessToken) && user;

  return (
    <div className="text-neutral-900">
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
        <button
          type="button"
          onClick={() => setTab("guest")}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-semibold transition",
            tab === "guest"
              ? "bg-neutral-900 text-white shadow-sm"
              : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
          )}
        >
          My bookings
        </button>
        <button
          type="button"
          onClick={() => setTab("host")}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-semibold transition",
            tab === "host"
              ? "bg-neutral-900 text-white shadow-sm"
              : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
          )}
        >
          My hosting
        </button>
      </div>

      {tab === "guest" && (
        <div
          className={cn(
            "mt-8 flex flex-col",
            compactBookingCards ? "gap-2" : "gap-4",
          )}
        >
          {showCircleGuest && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-900">
                Circle meets
              </p>
              {circleLoading && (
                <p className="text-sm text-neutral-600">Loading…</p>
              )}
              {!circleLoading && circleApps.length === 0 && (
                <p className="text-sm font-medium text-neutral-700">
                  No Circle applications yet.
                </p>
              )}
              <ul
                className={cn(
                  "flex flex-col",
                  compactBookingCards ? "gap-2" : "gap-4",
                )}
              >
                {circleApps.map((app) => (
                  <CircleGuestApplicationCard
                    key={app.id}
                    app={app}
                    accessToken={accessToken!}
                    hostedEvents={hostedEvents}
                    circleCatalogEvents={circleCatalogEvents}
                    onRefresh={() => void loadCircleApps()}
                    compactBookingCards={compactBookingCards}
                  />
                ))}
              </ul>
            </div>
          )}

          {showCircleGuest && mockGuestBookings.length > 0 && (
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Demo and local bookings
            </p>
          )}

          <ul
            className={cn(
              "flex flex-col",
              compactBookingCards ? "gap-2" : "gap-4",
            )}
          >
          {!circleLoading &&
            circleApps.length === 0 &&
            mockGuestBookings.length === 0 &&
            !showCircleGuest && (
            <li className="text-sm font-medium text-neutral-900">
              No bookings yet.
            </li>
          )}
          {!circleLoading &&
            showCircleGuest &&
            circleApps.length === 0 &&
            mockGuestBookings.length === 0 && (
              <li className="text-sm font-medium text-neutral-700">
                No demo bookings — explore meets to join one.
              </li>
            )}
          {mockGuestBookings.map((b) => {
            const ev = getEventFromCatalog(
              b.eventId,
              hostedEvents,
              circleCatalogEvents,
            );
            if (!ev) return null;
            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
            const shareUrl = `${origin}/event/${ev.id}?booking=${b.id}`;
            return (
              <li
                key={b.id}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  <div className="relative h-36 w-full shrink-0 bg-neutral-100 sm:w-40 md:w-44">
                    <Image
                      src={ev.image}
                      alt=""
                      fill
                      sizes="(max-width:640px) 100vw, 176px"
                      className="object-cover"
                    />
                  </div>
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5",
                      compactBookingCards && "gap-3 p-3 sm:p-4",
                    )}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <BookingStatusBadge status={b.status} />
                        {b.refundedAt && (
                          <span className="text-xs font-semibold text-neutral-700">
                            Refunded (demo)
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/event/${ev.id}`}
                        className="mt-2 block font-onest text-lg font-semibold text-neutral-900 hover:text-primary hover:underline"
                      >
                        {ev.title}
                      </Link>
                      <p className="mt-1 text-sm font-medium text-neutral-800">
                        {new Date(b.createdAt).toLocaleString()}
                      </p>
                      {(b.status === "confirmed" || b.status === "attended") &&
                        b.attendanceCode && (
                          <p className="mt-3 font-mono text-sm tracking-wider text-neutral-900">
                            Check-in code:{" "}
                            <span className="font-semibold">
                              {b.attendanceCode}
                            </span>
                            <span className="ml-2 text-xs font-sans text-neutral-800">
                              (show host at arrival)
                            </span>
                          </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                        onClick={() => copyText("Share link", shareUrl)}
                      >
                        Share booking
                      </button>
                      {(b.status === "pending" || b.status === "confirmed") && (
                        <>
                          <button
                            type="button"
                            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                            onClick={() => {
                              cancelBooking(b.id);
                              toast.success("Booking cancelled (mock).");
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                            onClick={() => {
                              refundBooking(b.id);
                              toast.success("Refund recorded (mock).");
                            }}
                          >
                            Refund
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        </div>
      )}

      {tab === "host" && (
        <div
          className={cn(
            "mt-8 flex flex-col",
            compactBookingCards ? "gap-2" : "gap-4",
          )}
        >
          {myHosting.length === 0 && (
            <p className="text-sm font-medium text-neutral-900">
              You’re not hosting any meets yet —{" "}
              <Link
                href="/host-a-meet"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                create one
              </Link>
              .
            </p>
          )}
          {myHosting.map((ev) => (
            <HostMeetCard
              key={ev.id}
              event={ev}
              canEditMeet={hostedEvents.some((h) => h.id === ev.id)}
              accessToken={accessToken}
              expanded={expandedId === ev.id}
              onToggle={() =>
                setExpandedId((x) => (x === ev.id ? null : ev.id))
              }
              codeInputs={codeInputs}
              setCodeInputs={setCodeInputs}
              bookings={bookings}
              updateHostedEvent={updateHostedEvent}
              deleteHostedEvent={deleteHostedEvent}
              approveBooking={approveBooking}
              removeGuestBooking={removeGuestBooking}
              markAttendance={markAttendance}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HostListingBadges({ ev }: { ev: MeetEvent }) {
  const listing =
    (ev.listingVisibility ?? "public") === "public"
      ? "Public listing"
      : "Private link";
  const join =
    (ev.joinMode ?? "open") === "invite" ? "Invite only" : "Open joins";
  return (
    <div className="flex flex-wrap gap-2">
      {ev.cancelledAt ? (
        <span className="inline-flex rounded-full border border-neutral-500 bg-neutral-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-800">
          Cancelled
        </span>
      ) : null}
      <span className="inline-flex rounded-full border border-neutral-900 bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-900">
        Hosting
      </span>
      <span className="inline-flex rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-900">
        {listing}
      </span>
      <span className="inline-flex rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-900">
        {join}
      </span>
    </div>
  );
}

function HostMeetCard({
  event: ev,
  canEditMeet,
  accessToken,
  expanded,
  onToggle,
  codeInputs,
  setCodeInputs,
  bookings,
  updateHostedEvent,
  deleteHostedEvent,
  approveBooking,
  removeGuestBooking,
  markAttendance,
}: {
  event: MeetEvent;
  canEditMeet: boolean;
  accessToken: string | null;
  expanded: boolean;
  onToggle: () => void;
  codeInputs: Record<string, string>;
  setCodeInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  bookings: Booking[];
  updateHostedEvent: (id: string, patch: Partial<MeetEvent>) => void;
  deleteHostedEvent: (id: string) => void;
  approveBooking: (id: string) => void;
  removeGuestBooking: (id: string) => void;
  markAttendance: (id: string, code: string) => boolean;
}) {
  const user = useSessionStore((s) => s.user);
  const compactBookingCards = useSessionStore(
    (s) => s.uiPrefs.compactBookingCards,
  );
  const showCircleHostPanel =
    isCircleApiConfigured() &&
    Boolean(accessToken) &&
    ev.cityId === "circle" &&
    user != null &&
    ev.hostUserId === user.id;
  const [hostFilter, setHostFilter] = useState<"all" | "pending" | "verified">(
    "all",
  );
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const hostShare = ev.shareToken
    ? `${origin}/event/${ev.id}?t=${ev.shareToken}`
    : `${origin}/event/${ev.id}`;

  const eventBookings = bookings.filter((b) => b.eventId === ev.id);

  const filtered = eventBookings.filter((b) => {
    if (hostFilter === "pending") return b.status === "pending";
    if (hostFilter === "verified") {
      const u = lookupUser(b.userId);
      return u?.verified === true;
    }
    return true;
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div className="relative h-36 w-full shrink-0 bg-neutral-100 sm:w-40 md:w-44">
          <Image
            src={ev.image}
            alt=""
            fill
            sizes="(max-width:640px) 100vw, 176px"
            className="object-cover"
          />
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:p-5",
            compactBookingCards && "gap-2 p-3 sm:p-4",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <HostListingBadges ev={ev} />
              <h3 className="font-onest mt-2 text-lg font-semibold text-neutral-900">
                {ev.title}
              </h3>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                {new Date(ev.startsAt).toLocaleString()}
                {ev.venueName ? ` · ${ev.venueName}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
              aria-expanded={expanded}
            >
              {expanded ? "Hide details" : "Manage"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
              onClick={() => copyText("Host share link", hostShare)}
            >
              Share meet link
            </button>
            <Link
              href={`/event/${ev.id}`}
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              View event
            </Link>
            {canEditMeet && !ev.cancelledAt && (
              <button
                type="button"
                className="rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm(
                      "Cancel this meet? It will be hidden from Explore; guests can still open the link (mock).",
                    )
                  ) {
                    updateHostedEvent(ev.id, {
                      cancelledAt: new Date().toISOString(),
                    });
                    toast.success("Meet cancelled (mock).");
                  }
                }}
              >
                Cancel meet
              </button>
            )}
            {canEditMeet && (
              <button
                type="button"
                className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-50"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm(
                      "Delete this meet and its guest list (mock)?",
                    )
                  ) {
                    deleteHostedEvent(ev.id);
                    toast.success("Meet removed.");
                  }
                }}
              >
                Delete meet
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-neutral-200 bg-neutral-50/50 px-4 py-5 sm:px-5">
          {!canEditMeet && !showCircleHostPanel && (
            <p className="text-xs font-medium text-neutral-800">
              Demo seed meet — publish your own from Host a meet for full edit
              and delete controls.
            </p>
          )}

          {canEditMeet && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-neutral-900">
                  Listing
                  <select
                    className="liquid-glass-input mt-1 w-full text-sm text-neutral-900"
                    value={ev.listingVisibility ?? "public"}
                    onChange={(e) =>
                      updateHostedEvent(ev.id, {
                        listingVisibility: e.target.value as
                          | "public"
                          | "private",
                      })
                    }
                  >
                    <option value="public">Public (Explore)</option>
                    <option value="private">Private (link only)</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-neutral-900">
                  Join policy
                  <select
                    className="liquid-glass-input mt-1 w-full text-sm text-neutral-900"
                    value={ev.joinMode ?? "open"}
                    onChange={(e) =>
                      updateHostedEvent(ev.id, {
                        joinMode: e.target.value as "open" | "invite",
                      })
                    }
                  >
                    <option value="open">Open</option>
                    <option value="invite">Invite (approve)</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-neutral-900">
                  Title
                  <input
                    className="liquid-glass-input mt-1 w-full text-sm text-neutral-900"
                    defaultValue={ev.title}
                    onBlur={(e) =>
                      updateHostedEvent(ev.id, { title: e.target.value })
                    }
                  />
                </label>
                <label className="text-xs font-semibold text-neutral-900">
                  Capacity
                  <input
                    type="number"
                    min={4}
                    className="liquid-glass-input mt-1 w-full text-sm text-neutral-900"
                    defaultValue={ev.capacity}
                    onBlur={(e) =>
                      updateHostedEvent(ev.id, {
                        capacity: Number(e.target.value) || ev.capacity,
                      })
                    }
                  />
                </label>
              </div>
            </>
          )}

          {showCircleHostPanel && accessToken ? (
            <CircleHostMeetSection
              eventId={ev.id}
              accessToken={accessToken}
              active={expanded}
            />
          ) : (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Guests
            </p>
            <div className="mt-2 flex gap-2">
              {(["all", "pending", "verified"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHostFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    hostFilter === f
                      ? "bg-neutral-900 text-white"
                      : "border border-neutral-300 text-neutral-900 hover:bg-neutral-100",
                  )}
                >
                  {f === "all"
                    ? "All"
                    : f === "pending"
                      ? "Applied"
                      : "Verified"}
                </button>
              ))}
            </div>

            <ul className="mt-3 space-y-2">
              {filtered.length === 0 && (
                <li className="text-sm font-medium text-neutral-900">
                  No guests in this view.
                </li>
              )}
              {filtered.map((b) => {
                const u = lookupUser(b.userId);
                const name =
                  u?.name ?? (b.userId.startsWith("u_") ? "Guest" : b.userId);
                return (
                  <li
                    key={b.id}
                    className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <BookingStatusBadge status={b.status} />
                          {u?.verified && (
                            <span className="rounded-full border border-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-900">
                              Verified guest
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-neutral-900">{name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {b.status === "pending" && (
                        <>
                          <button
                            type="button"
                            className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white"
                            onClick={() => {
                              approveBooking(b.id);
                              toast.success("Guest approved.");
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-900"
                            onClick={() => {
                              removeGuestBooking(b.id);
                              toast.success("Request removed.");
                            }}
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <div className="flex items-center gap-1">
                          <input
                            placeholder="OTP"
                            className="liquid-glass-input w-24 py-1 text-xs text-neutral-900"
                            value={codeInputs[b.id] ?? ""}
                            onChange={(e) =>
                              setCodeInputs((prev) => ({
                                ...prev,
                                [b.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="rounded-full border border-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-900"
                            onClick={() => {
                              const ok = markAttendance(
                                b.id,
                                codeInputs[b.id] ?? "",
                              );
                              if (ok) toast.success("Marked attended.");
                              else toast.error("Code does not match.");
                            }}
                          >
                            Mark
                          </button>
                        </div>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-800 hover:underline"
                          onClick={() => {
                            removeGuestBooking(b.id);
                            toast.success("Guest removed.");
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
