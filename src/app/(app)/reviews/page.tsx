"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { formatInrDateTime } from "@/lib/formatCurrency";
import { getEventFromCatalog } from "@/lib/eventsCatalog";
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

type TabId = "about" | "reviewMeet" | "reviewGuest" | "posted";

const tabs: { id: TabId; label: string }[] = [
  { id: "about", label: "About you" },
  { id: "reviewMeet", label: "Review a meet" },
  { id: "reviewGuest", label: "Review a guest" },
  { id: "posted", label: "Your reviews" },
];

export default function ReviewsPage() {
  const user = useSessionStore((s) => s.user);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const written = useSessionStore((s) => s.guestReviewsWritten);
  const attendeeMeetReviews = useSessionStore((s) => s.attendeeMeetReviews);
  const received = useSessionStore((s) => s.hostReviewsReceived);
  const addGuestReviewWritten = useSessionStore((s) => s.addGuestReviewWritten);
  const addAttendeeMeetReview = useSessionStore((s) => s.addAttendeeMeetReview);
  const seedDemoReviewsIfEmpty = useSessionStore((s) => s.seedDemoReviewsIfEmpty);

  const [tab, setTab] = useState<TabId>("about");

  const [meetBookingId, setMeetBookingId] = useState("");
  const [meetRating, setMeetRating] = useState(0);
  const [meetComment, setMeetComment] = useState("");

  const [guestName, setGuestName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    seedDemoReviewsIfEmpty();
  }, [seedDemoReviewsIfEmpty]);

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
      toast.error("Choose an attended meet, a rating, and a comment.");
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
    toast.success("Meet review posted");
    setMeetRating(0);
    setMeetComment("");
    setTab("posted");
  };

  const onSubmitHostGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const g = guestName.trim();
    const ev = eventTitle.trim();
    const c = comment.trim();
    if (!g || !ev || rating < 1 || !c) return;
    addGuestReviewWritten({
      guestName: g,
      eventTitle: ev,
      rating,
      comment: c,
    });
    setGuestName("");
    setEventTitle("");
    setRating(0);
    setComment("");
    toast.success("Review posted");
    setTab("posted");
  };

  const hasAttendedUnreviewed = reviewableAttended.length > 0;

  return (
    <div className="mx-auto max-w-3xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          Reviews
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
          Leave feedback on meets you attended, review guests when you host, and
          see what others say about you.
        </p>
      </div>

      <div
        className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1 sm:grid-cols-4"
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

        {tab === "reviewMeet" && (
          <section>
            <h2 className="text-lg font-semibold text-neutral-900">
              Review a meet you attended
            </h2>
            <p className="mt-1 text-sm text-neutral-900">
              You can only review meets where your booking is marked{" "}
              <span className="font-semibold">attended</span> (e.g. after check-in
              on the booking).
            </p>

            {!user ? (
              <p className="mt-6 text-sm text-neutral-600">Sign in to continue.</p>
            ) : !hasAttendedUnreviewed ? (
              <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-800">
                <p className="font-medium">
                  No meets available to review right now.
                </p>
                <p className="mt-2 text-neutral-600">
                  After you attend a meet and your booking shows as attended, you
                  can leave a review here.
                </p>
              </div>
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
                    Meet
                  </label>
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
                  Post meet review
                </button>
              </form>
            )}
          </section>
        )}

        {tab === "reviewGuest" && (
          <section>
            <h2 className="text-lg font-semibold text-neutral-900">
              Review a guest (host)
            </h2>
            <p className="mt-1 text-sm text-neutral-900">
              Saved locally in this browser — for hosts leaving feedback about a
              guest after a meet.
            </p>
            <form
              onSubmit={onSubmitHostGuest}
              className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div>
                <label
                  className="text-sm font-semibold text-neutral-900"
                  htmlFor="g-name"
                >
                  Guest name
                </label>
                <input
                  id="g-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="e.g. Sam P."
                  required
                />
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-neutral-900"
                  htmlFor="g-event"
                >
                  Meet / event title
                </label>
                <input
                  id="g-event"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="e.g. Sunday brunch circle"
                  required
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Rating</p>
                <div className="mt-2">
                  <StarInput value={rating} onChange={setRating} />
                </div>
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-neutral-900"
                  htmlFor="g-comment"
                >
                  Comment
                </label>
                <textarea
                  id="g-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                  placeholder="What stood out?"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!user || rating < 1}
                className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                Post review
              </button>
            </form>
          </section>
        )}

        {tab === "posted" && (
          <div className="space-y-12">
            <section>
              <h2 className="text-lg font-semibold text-neutral-900">
                Meet reviews you posted
              </h2>
              <p className="mt-1 text-sm text-neutral-900">
                Feedback you left as an attendee (after attending).
              </p>
              <ul className="mt-4 space-y-4">
                {attendeeMeetReviews.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-sm font-medium text-neutral-900">
                    You haven&apos;t posted any meet reviews yet.
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

            <section>
              <h2 className="text-lg font-semibold text-neutral-900">
                Guest reviews you posted
              </h2>
              <p className="mt-1 text-sm text-neutral-900">
                Feedback you left as a host about a guest.
              </p>
              <ul className="mt-4 space-y-4">
                {written.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-sm font-medium text-neutral-900">
                    You haven&apos;t posted any guest reviews yet.
                  </li>
                ) : (
                  written.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-neutral-900">
                            {r.guestName}
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
      </div>
    </div>
  );
}
