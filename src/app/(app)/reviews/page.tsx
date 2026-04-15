"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, Star } from "lucide-react";
import { toast } from "sonner";
import { formatInrDateTime } from "@/lib/formatCurrency";
import { getMyApplications } from "@/lib/circle/applicationsApi";
import { submitHostRating } from "@/lib/circle/ratingsApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type { CircleMyApplication } from "@/lib/circle/types";
import { getEventFromCatalog } from "@/lib/eventsCatalog";
import { selectAccessToken, selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";

function StarsDisplay({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const full = Math.min(5, Math.max(0, Math.round(value)));
  const dim =
    size === "lg" ? "h-8 w-8" : size === "md" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${value.toFixed(1)} out of 5 average`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            dim,
            i <= full ? "fill-amber-400 text-amber-400" : "text-neutral-300",
          )}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function EmptyNoMeetsAttended({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-linear-to-b from-neutral-50 to-white px-6 py-12 text-center shadow-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 shadow-inner ring-1 ring-neutral-200/80"
        aria-hidden
      >
        <CalendarX2 className="h-10 w-10" strokeWidth={1.35} />
      </div>
      <p className="font-onest text-lg font-semibold tracking-tight text-neutral-900">
        No meets attended
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
        You don&apos;t have any attended meets to review yet. Book a meet, show
        up, and after the host marks you as{" "}
        <span className="font-semibold text-neutral-800">attended</span>, it will
        appear in the list above so you can leave a review.
      </p>
    </div>
  );
}

function EmptyNoGuestReviewsPosted({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-linear-to-b from-neutral-50 to-white px-6 py-10 text-center shadow-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 ring-1 ring-neutral-200/80"
        aria-hidden
      >
        <Star className="h-8 w-8" strokeWidth={1.35} />
      </div>
      <p className="font-onest text-base font-semibold text-neutral-900">
        No guest reviews yet
      </p>
      <p className="mt-2 max-w-sm text-sm text-neutral-600">
        When you review a meet under{" "}
        <span className="font-semibold text-neutral-800">Review as a guest</span>,
        it will show up here.
      </p>
    </div>
  );
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="rounded p-0.5 transition hover:scale-105 focus-visible:outline focus-visible:ring-2 focus-visible:ring-neutral-900"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(n)}
          aria-label={`${n} stars`}
        >
          <Star
            className={cn(
              "h-8 w-8",
              n <= active ? "fill-amber-400 text-amber-400" : "text-neutral-300",
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-neutral-900">
        {value > 0 ? `${value} / 5` : "Choose rating"}
      </span>
    </div>
  );
}

type TabId = "about" | "reviewAsGuest" | "posted";

const tabs: { id: TabId; label: string }[] = [
  { id: "about", label: "About you" },
  { id: "reviewAsGuest", label: "Review as a guest" },
  { id: "posted", label: "Your reviews" },
];

const RATEABLE_CIRCLE = new Set([
  "attended",
  "checked_in",
  "selected",
  "confirmed",
]);

export default function ReviewsPage() {
  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const attendeeMeetReviews = useSessionStore((s) => s.attendeeMeetReviews);
  const received = useSessionStore((s) => s.hostReviewsReceived);
  const addAttendeeMeetReview = useSessionStore((s) => s.addAttendeeMeetReview);
  const [tab, setTab] = useState<TabId>("about");

  const [meetBookingId, setMeetBookingId] = useState("");
  const [meetRating, setMeetRating] = useState(0);
  const [meetComment, setMeetComment] = useState("");

  const [circleApps, setCircleApps] = useState<CircleMyApplication[]>([]);
  const [circleAppId, setCircleAppId] = useState("");
  const [circleRating, setCircleRating] = useState(0);
  const [circleComment, setCircleComment] = useState("");
  const [circleSubmitting, setCircleSubmitting] = useState(false);

  useEffect(() => {
    if (!isCircleApiConfigured() || !accessToken) {
      setCircleApps([]);
      return;
    }
    let cancelled = false;
    void getMyApplications(accessToken)
      .then((rows) => {
        if (!cancelled) setCircleApps(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setCircleApps([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const circleRateable = useMemo(
    () =>
      circleApps.filter(
        (a) =>
          Boolean(a.event?.id) && RATEABLE_CIRCLE.has(a.status),
      ),
    [circleApps],
  );

  useEffect(() => {
    if (!circleAppId && circleRateable.length > 0) {
      setCircleAppId(circleRateable[0].id);
    }
    if (
      circleAppId &&
      !circleRateable.some((a) => a.id === circleAppId)
    ) {
      setCircleAppId(circleRateable[0]?.id ?? "");
    }
  }, [circleRateable, circleAppId]);

  const reviewableAttended = useMemo(() => {
    if (!user) return [];
    const reviewedIds = new Set(
      attendeeMeetReviews.map((r) => r.bookingId),
    );
    return bookings
      .filter(
        (b) =>
          b.userId === user.id &&
          b.status === "attended" &&
          !reviewedIds.has(b.id),
      )
      .map((b) => {
        const ev = getEventFromCatalog(
          b.eventId,
          hostedEvents,
          circleCatalogEvents,
        );
        const title = ev?.title ?? "Meet";
        const when = ev?.startsAt
          ? formatInrDateTime(ev.startsAt)
          : "";
        return {
          bookingId: b.id,
          eventId: b.eventId,
          eventTitle: title,
          label: when ? `${title} · ${when}` : title,
        };
      });
  }, [
    user,
    bookings,
    hostedEvents,
    circleCatalogEvents,
    attendeeMeetReviews,
  ]);

  useEffect(() => {
    if (!meetBookingId && reviewableAttended.length > 0) {
      setMeetBookingId(reviewableAttended[0].bookingId);
    }
    if (
      meetBookingId &&
      !reviewableAttended.some((o) => o.bookingId === meetBookingId)
    ) {
      setMeetBookingId(reviewableAttended[0]?.bookingId ?? "");
    }
  }, [reviewableAttended, meetBookingId]);

  const average = useMemo(() => {
    if (!received.length) return 0;
    const sum = received.reduce((a, r) => a + r.rating, 0);
    return sum / received.length;
  }, [received]);

  const onSubmitGuestMeet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const selected = reviewableAttended.find(
      (o) => o.bookingId === meetBookingId,
    );
    const c = meetComment.trim();
    if (!selected || meetRating < 1 || !c) {
      toast.error("Select the meet you attended, add a rating, and a comment.");
      return;
    }
    const result = addAttendeeMeetReview({
      bookingId: selected.bookingId,
      eventId: selected.eventId,
      eventTitle: selected.eventTitle,
      rating: meetRating,
      comment: c,
    });
    if (!result.ok) {
      if (result.reason === "duplicate") {
        toast.error("You already reviewed this meet.");
      } else {
        toast.error("Only attended bookings can be reviewed.");
      }
      return;
    }
    toast.success("Review posted");
    setMeetRating(0);
    setMeetComment("");
    setTab("posted");
  };

  const onSubmitCircleRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const app = circleRateable.find((a) => a.id === circleAppId);
    const evId = app?.event?.id;
    const c = circleComment.trim();
    if (!app || !evId || circleRating < 1 || !c) {
      toast.error("Select an event, rating, and comment.");
      return;
    }
    setCircleSubmitting(true);
    void submitHostRating(accessToken, {
      event_id: evId,
      rating: circleRating,
      comment: c,
    })
      .then(() => {
        toast.success("Rating submitted to Circle");
        setCircleRating(0);
        setCircleComment("");
      })
      .catch((err) => {
        toast.error(
          err instanceof CircleApiError
            ? err.message
            : "Could not submit rating",
        );
      })
      .finally(() => setCircleSubmitting(false));
  };

  const hasAttendedUnreviewed = reviewableAttended.length > 0;

  return (
    <div className="mx-auto max-w-3xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          Reviews
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
          As a guest, review meets you actually attended. See feedback others
          leave about your hosting.
        </p>
      </div>

      <div
        className="mt-6 grid grid-cols-1 gap-1 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1 sm:grid-cols-3"
        role="tablist"
        aria-label="Reviews sections"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-10 rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:px-3 sm:text-sm",
              tab === t.id
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8" role="tabpanel">
        {tab === "about" && (
          <div className="space-y-10">
            <section className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-neutral-900">
                Your overall rating
              </h2>
              <p className="mt-1 text-sm text-neutral-900">
                Average from reviews guests left about you (out of 5).
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <StarsDisplay value={average} size="lg" />
                <div>
                  <p className="text-3xl font-bold tabular-nums text-neutral-900">
                    {received.length ? average.toFixed(1) : "—"}
                  </p>
                  <p className="text-sm font-medium text-neutral-900">
                    {received.length} review{received.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">
                Reviews about you
              </h2>
              <ul className="mt-4 space-y-4">
                {received.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-sm font-medium text-neutral-900">
                    No reviews yet — when guests leave feedback, it will show
                    here.
                  </li>
                ) : (
                  received.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-neutral-900">
                            {r.reviewerName}
                          </p>
                          <p className="text-sm font-medium text-neutral-900">
                            {r.eventTitle}
                          </p>
                        </div>
                        <StarsDisplay value={r.rating} />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-neutral-900">
                        {r.comment}
                      </p>
                      <p className="mt-2 text-xs font-medium text-neutral-900">
                        {formatInrDateTime(r.createdAt)}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        )}

        {tab === "reviewAsGuest" && (
          <section>
            <h2 className="text-lg font-semibold text-neutral-900">
              Review as a guest
            </h2>
            <p className="mt-1 text-sm text-neutral-900">
              You must <span className="font-semibold">choose the meet you attended</span>{" "}
              from the list below. There is no other way to submit a guest review.
            </p>

            {isCircleApiConfigured() && accessToken && circleRateable.length > 0 ? (
              <form
                onSubmit={onSubmitCircleRating}
                className="mt-6 space-y-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-6 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-violet-900">
                  Rate host (Circle API)
                </p>
                <label className="block text-sm font-semibold text-neutral-900">
                  Application / event
                  <select
                    value={circleAppId}
                    onChange={(e) => setCircleAppId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm"
                    required
                  >
                    {circleRateable.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.event?.title ?? a.id} · {a.status}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Rating</p>
                  <div className="mt-2">
                    <StarInput value={circleRating} onChange={setCircleRating} />
                  </div>
                </div>
                <label className="block text-sm font-semibold text-neutral-900">
                  Comment
                  <textarea
                    value={circleComment}
                    onChange={(e) => setCircleComment(e.target.value)}
                    className="mt-2 min-h-[100px] w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={circleSubmitting}
                  className="rounded-full bg-violet-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
                >
                  {circleSubmitting ? "Submitting…" : "Submit to Circle"}
                </button>
              </form>
            ) : isCircleApiConfigured() && accessToken ? (
              <p className="mt-4 rounded-xl border border-dashed border-violet-200 bg-violet-50/30 px-4 py-3 text-sm text-neutral-700">
                No Circle applications in a rateable state yet (attended / checked in / confirmed).
              </p>
            ) : null}

            {!user ? (
              <p className="mt-6 text-sm text-neutral-600">Sign in to continue.</p>
            ) : !hasAttendedUnreviewed ? (
              <EmptyNoMeetsAttended className="mt-6" />
            ) : (
              <form
                onSubmit={onSubmitGuestMeet}
                className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <label
                    className="text-sm font-semibold text-neutral-900"
                    htmlFor="meet-booking"
                  >
                    Select meet attended <span className="text-red-600">*</span>
                  </label>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    Required — choose the meet you were checked in for.
                  </p>
                  <select
                    id="meet-booking"
                    value={meetBookingId}
                    onChange={(e) => setMeetBookingId(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                    required
                  >
                    {reviewableAttended.map((o) => (
                      <option key={o.bookingId} value={o.bookingId}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Rating</p>
                  <div className="mt-2">
                    <StarInput value={meetRating} onChange={setMeetRating} />
                  </div>
                </div>
                <div>
                  <label
                    className="text-sm font-semibold text-neutral-900"
                    htmlFor="meet-comment"
                  >
                    Comment
                  </label>
                  <textarea
                    id="meet-comment"
                    value={meetComment}
                    onChange={(e) => setMeetComment(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                    placeholder="How was the host and the experience?"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={meetRating < 1 || !meetComment.trim()}
                  className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  Post review
                </button>
              </form>
            )}
          </section>
        )}

        {tab === "posted" && (
          <section>
            <h2 className="text-lg font-semibold text-neutral-900">
              Reviews you posted as a guest
            </h2>
            <p className="mt-1 text-sm text-neutral-900">
              Meets you reviewed after attending (one review per attended
              booking).
            </p>
            <ul className="mt-4 space-y-4">
              {attendeeMeetReviews.length === 0 ? (
                <li className="list-none p-0">
                  <EmptyNoGuestReviewsPosted />
                </li>
              ) : (
                attendeeMeetReviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-semibold text-neutral-900">
                        {r.eventTitle}
                      </p>
                      <StarsDisplay value={r.rating} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-900">
                      {r.comment}
                    </p>
                    <p className="mt-2 text-xs font-medium text-neutral-900">
                      {formatInrDateTime(r.createdAt)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
