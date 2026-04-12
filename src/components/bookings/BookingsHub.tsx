"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  acceptWaitlistOffer,
  cancelApplication,
  cancelEventAsHost,
  deleteEvent,
  generateCheckinOtp,
  getPayment,
  getWaitlistPosition,
} from "@/lib/circle/api";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { TicketModal } from "@/components/bookings/TicketModal";
import { downloadApplicationInvoice } from "@/lib/circle/invoicesApi";
import type { CircleMyApplication, CirclePaymentDetails } from "@/lib/circle/types";
import {
  getEventFromCatalog,
  mergeEventCatalog,
} from "@/lib/eventsCatalog";
import {
  buildMeetPaymentDescription,
  canOpenRazorpayCheckout,
  openRazorpayFromPayload,
} from "@/lib/razorpay/loadCheckout";
import { CalendarDays, ImageOff, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { selectAccessToken, selectUser } from "@/lib/store/authSlice";
import { useMyApplicationsQuery } from "@/lib/store/circleApi";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import type { MeetEvent } from "@/lib/types";
import { meetEventGalleryUrls, primaryMeetImage } from "@/lib/events/coverDisplay";

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

/** Empty “My bookings” when the user has no Circle applications yet */
function GuestBookingsEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-violet-200/90 bg-linear-to-b from-violet-50/90 to-white px-5 py-10 text-center shadow-sm sm:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-800 shadow-inner"
          aria-hidden
        >
          <CalendarDays className="h-8 w-8" strokeWidth={1.75} />
        </div>
        <div className="space-y-2">
          <p className="font-onest text-lg font-semibold text-neutral-900">
            No bookings yet
          </p>
          <p className="text-sm leading-relaxed text-neutral-600">
            When you apply to meets, your applications and tickets show up here.
            Explore what&apos;s happening near you and join a meet in a few taps.
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800"
        >
          See available meets
        </Link>
      </div>
    </div>
  );
}

/** Empty “My hosting” */
function HostBookingsEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200/90 bg-neutral-50/80 px-5 py-10 text-center sm:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-200/90 text-neutral-800"
          aria-hidden
        >
          <Mic2 className="h-8 w-8" strokeWidth={1.75} />
        </div>
        <div className="space-y-2">
          <p className="font-onest text-lg font-semibold text-neutral-900">
            Not hosting yet
          </p>
          <p className="text-sm leading-relaxed text-neutral-600">
            Create a meet, share the link, and manage guests from this tab.
          </p>
        </div>
        <Link
          href="/host-a-meet"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800"
        >
          Host a meet
        </Link>
      </div>
    </div>
  );
}

function MeetImageFrame({ imageUrl }: { imageUrl: string }) {
  if (imageUrl.startsWith("data:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  }
  return (
    <Image
      src={imageUrl}
      alt=""
      fill
      sizes="(max-width:640px) 100vw, 176px"
      className="object-cover"
      unoptimized={imageUrl.startsWith("http://")}
    />
  );
}

function MeetCover({
  event,
  autoRotate = true,
}: {
  event: MeetEvent;
  autoRotate?: boolean;
}) {
  const gallery = useMemo(() => meetEventGalleryUrls(event), [event]);
  const [idx, setIdx] = useState(0);
  const safeIdx = gallery.length > 0 ? idx % gallery.length : 0;

  useEffect(() => {
    if (!autoRotate || gallery.length < 2) return;
    const timer = window.setInterval(() => {
      setIdx((prev) => (prev + 1) % gallery.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [autoRotate, gallery]);

  if (gallery.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
        <ImageOff className="h-6 w-6" aria-hidden />
      </div>
    );
  }

  return (
    <>
      <MeetImageFrame imageUrl={gallery[safeIdx] ?? gallery[0]} />
      {gallery.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {gallery.map((url, dotIdx) => (
            <span
              key={`${url}-${dotIdx}`}
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white/70",
                dotIdx === safeIdx && "w-4 bg-white",
              )}
            />
          ))}
        </div>
      )}
    </>
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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
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
  const user = useAppSelector(selectUser);
  const eventId = app.event?.id ?? "";
  const ev = eventId
    ? getEventFromCatalog(eventId, hostedEvents, circleCatalogEvents)
    : null;
  const title = app.event?.title ?? "Event";
  const hostName = app.event?.host?.username;
  const image = ev ? primaryMeetImage(ev) : null;

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
      if (canOpenRazorpayCheckout(pay)) {
        const priceLabel =
          ev && ev.priceCents > 0
            ? `₹${(ev.priceCents / 100).toFixed(0)}`
            : "Free";
        await openRazorpayFromPayload({
          payload: pay,
          title: "Grow Circle",
          description: ev
            ? buildMeetPaymentDescription({
                eventTitle: title,
                startsAtIso: ev.startsAt,
                venue: ev.venueName,
                priceLabel,
              })
            : title,
          prefill: user
            ? { name: user.name, email: user.email }
            : undefined,
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
        <div className="relative h-44 w-full shrink-0 bg-neutral-100 sm:h-auto sm:w-40 md:w-44">
          {image ? (
            <MeetImageFrame imageUrl={image} />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-500">
              <ImageOff className="h-6 w-6" aria-hidden />
            </div>
          )}
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
  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const updateHostedEvent = useSessionStore((s) => s.updateHostedEvent);
  const deleteHostedEvent = useSessionStore((s) => s.deleteHostedEvent);
  const compactBookingCards = useSessionStore(
    (s) => s.uiPrefs.compactBookingCards,
  );

  const [tab, setTab] = useState<Tab>("guest");
  const {
    data: circleApps = [],
    isLoading: circleLoading,
    refetch: refetchCircleApps,
  } = useMyApplicationsQuery(undefined, {
    skip: !accessToken || !isCircleApiConfigured(),
  });

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents, circleCatalogEvents),
    [hostedEvents, circleCatalogEvents],
  );

  const myHosting = useMemo(() => {
    if (!user) return [];
    return catalog.filter((e) => e.hostUserId === user.id);
  }, [catalog, user]);

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
                <GuestBookingsEmptyState />
              )}
              {!circleLoading && circleApps.length > 0 && (
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
                      onRefresh={() => void refetchCircleApps()}
                      compactBookingCards={compactBookingCards}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}

          {!circleLoading &&
            circleApps.length === 0 &&
            !showCircleGuest && (
              <ul
                className={cn(
                  "flex flex-col",
                  compactBookingCards ? "gap-2" : "gap-4",
                )}
              >
                <li className="text-sm font-medium text-neutral-700">
                  {!isCircleApiConfigured() ? (
                    <>
                      Set{" "}
                      <code className="rounded bg-neutral-100 px-1 text-xs">
                        NEXT_PUBLIC_CIRCLE_API_BASE
                      </code>{" "}
                      and sign in to load bookings from the server.
                    </>
                  ) : (
                    <>Sign in to see your Circle applications and bookings.</>
                  )}
                </li>
              </ul>
            )}
        </div>
      )}

      {tab === "host" && (
        <div
          className={cn(
            "mt-8 flex flex-col",
            compactBookingCards ? "gap-2" : "gap-4",
          )}
        >
          {myHosting.length === 0 && <HostBookingsEmptyState />}
          {myHosting.map((ev) => (
            <HostMeetCard
              key={ev.id}
              event={ev}
              canEditMeet={hostedEvents.some((h) => h.id === ev.id)}
              accessToken={accessToken}
              updateHostedEvent={updateHostedEvent}
              deleteHostedEvent={deleteHostedEvent}
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
  updateHostedEvent,
  deleteHostedEvent,
}: {
  event: MeetEvent;
  canEditMeet: boolean;
  accessToken: string | null;
  updateHostedEvent: (id: string, patch: Partial<MeetEvent>) => void;
  deleteHostedEvent: (id: string) => void;
}) {
  const user = useAppSelector(selectUser);
  const compactBookingCards = useSessionStore(
    (s) => s.uiPrefs.compactBookingCards,
  );
  const reduceMotionUi = useSessionStore((s) => s.uiPrefs.reduceMotionUi);
  const showCircleHostPanel =
    isCircleApiConfigured() &&
    Boolean(accessToken) &&
    ev.cityId === "circle" &&
    user != null &&
    ev.hostUserId === user.id;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const hostShare = ev.shareToken
    ? `${origin}/event/${ev.id}?t=${ev.shareToken}`
    : `${origin}/event/${ev.id}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div className="relative h-44 w-full shrink-0 bg-neutral-100 sm:h-auto sm:w-40 md:w-44">
          <MeetCover event={ev} autoRotate={!reduceMotionUi} />
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
            <Link
              href={`/bookings/host/${ev.id}`}
              className="shrink-0 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
            >
              Manage
            </Link>
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
                      "Cancel this meet? It will be marked cancelled for guests.",
                    )
                  ) {
                    void (async () => {
                      if (showCircleHostPanel && accessToken) {
                        try {
                          await cancelEventAsHost(accessToken, ev.id);
                          updateHostedEvent(ev.id, {
                            cancelledAt: new Date().toISOString(),
                          });
                          toast.success("Meet cancelled.");
                        } catch (e) {
                          toast.error(
                            e instanceof CircleApiError
                              ? e.message
                              : e instanceof Error
                                ? e.message
                                : "Could not cancel meet",
                          );
                        }
                        return;
                      }
                      updateHostedEvent(ev.id, {
                        cancelledAt: new Date().toISOString(),
                      });
                      toast.success("Meet cancelled.");
                    })();
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
                      "Delete this meet and remove it from your hosting list?",
                    )
                  ) {
                    void (async () => {
                      if (showCircleHostPanel && accessToken) {
                        try {
                          await deleteEvent(accessToken, ev.id);
                          deleteHostedEvent(ev.id);
                          toast.success("Meet removed.");
                        } catch (e) {
                          toast.error(
                            e instanceof CircleApiError
                              ? e.message
                              : e instanceof Error
                                ? e.message
                                : "Could not delete meet",
                          );
                        }
                        return;
                      }
                      deleteHostedEvent(ev.id);
                      toast.success("Meet removed.");
                    })();
                  }
                }}
              >
                Delete meet
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
