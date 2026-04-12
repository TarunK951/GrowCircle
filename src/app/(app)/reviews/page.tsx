"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
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

export default function ReviewsPage() {
  const user = useSessionStore((s) => s.user);
  const written = useSessionStore((s) => s.guestReviewsWritten);
  const received = useSessionStore((s) => s.hostReviewsReceived);
  const addGuestReviewWritten = useSessionStore((s) => s.addGuestReviewWritten);
  const seedDemoReviewsIfEmpty = useSessionStore((s) => s.seedDemoReviewsIfEmpty);

  const [guestName, setGuestName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    seedDemoReviewsIfEmpty();
  }, [seedDemoReviewsIfEmpty]);

  const average = useMemo(() => {
    if (!received.length) return 0;
    const sum = received.reduce((a, r) => a + r.rating, 0);
    return sum / received.length;
  }, [received]);

  const onSubmit = (e: React.FormEvent) => {
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
  };

  return (
    <div className="mx-auto max-w-3xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-8">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          Reviews
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-900">
          Post reviews for guests after a meet, and see feedback others have left
          about your hosting.
        </p>
      </div>

      <section className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 sm:p-8">
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

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900">
          Reviews about you
        </h2>
        <ul className="mt-4 space-y-4">
          {received.length === 0 ? (
            <li className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-sm font-medium text-neutral-900">
              No reviews yet — when guests leave feedback, it will show here.
            </li>
          ) : (
            received.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">{r.reviewerName}</p>
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
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-neutral-900">
          Review a guest
        </h2>
        <p className="mt-1 text-sm text-neutral-900">
          Saved locally in this browser — share honest feedback after your meet.
        </p>
        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="text-sm font-semibold text-neutral-900" htmlFor="g-name">
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
            <label className="text-sm font-semibold text-neutral-900" htmlFor="g-event">
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
            <label className="text-sm font-semibold text-neutral-900" htmlFor="g-comment">
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

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-neutral-900">
          Reviews you&apos;ve posted
        </h2>
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
                    <p className="font-semibold text-neutral-900">{r.guestName}</p>
                    <p className="text-sm font-medium text-neutral-900">{r.eventTitle}</p>
                  </div>
                  <StarsDisplay value={r.rating} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-900">
                  {r.comment}
                </p>
                <p className="mt-2 text-xs font-medium text-neutral-900">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
