"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PrimaryButton, SecondaryButton } from "@/components/ui/MarketingButton";
import { applyToEvent, getEventQuestions } from "@/lib/circle/api";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import type { CircleEventQuestion } from "@/lib/circle/types";
import { getEventFromCatalog } from "@/lib/eventsCatalog";
import {
  canOpenRazorpayCheckout,
  openRazorpayFromPayload,
} from "@/lib/razorpay/loadCheckout";
import type { MeetEvent, PreJoinQuestion } from "@/lib/types";
import { useSessionStore } from "@/stores/session-store";

export function SaveEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const saved = useSessionStore((s) => s.savedEventIds.includes(eventId));
  const toggleSaved = useSessionStore((s) => s.toggleSaved);

  return (
    <SecondaryButton
      label={saved ? "Saved" : "Save meet"}
      onClick={() => {
        if (!isAuthenticated) {
          router.push(`/login?returnUrl=/event/${eventId}`);
          return;
        }
        toggleSaved(eventId);
        toast.success(saved ? "Removed from saved" : "Saved for later");
      }}
      className="!min-w-[160px]"
    />
  );
}

function mapRemoteQuestionsToPreJoin(
  questions: CircleEventQuestion[],
): PreJoinQuestion[] {
  return questions
    .filter(
      (q) =>
        q.question_type === "single_select" ||
        q.question_type === "multi_select",
    )
    .map((q, i) => ({
      id: q.id || `q_${i}`,
      prompt: q.question_text,
      options:
        q.options && q.options.length >= 2
          ? q.options
          : ["Option A", "Option B"],
    }));
}

function PreJoinModal({
  event,
  open,
  onClose,
  onConfirm,
  busy,
}: {
  event: MeetEvent;
  open: boolean;
  onClose: () => void;
  onConfirm: (answers: Record<string, string>) => void | Promise<void>;
  busy?: boolean;
}) {
  const questions = event.preJoinQuestions ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!open) return null;

  const setAnswer = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const q of questions) {
      if (!answers[q.id]?.trim()) {
        toast.error("Please answer every question.");
        return;
      }
    }
    await Promise.resolve(onConfirm(answers));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prejoin-dialog-title"
        className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/15 bg-white p-6 shadow-xl"
      >
        <h2
          id="prejoin-dialog-title"
          className="font-onest text-lg font-semibold text-foreground"
        >
          Before you join
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The host asked a few quick questions.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-8">
          {questions.map((q) => (
            <fieldset key={q.id} className="min-w-0 space-y-3">
              <legend className="text-sm font-medium text-foreground">
                {q.prompt}
              </legend>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-primary/10 bg-white/80 px-3 py-2 text-sm has-[:checked]:border-primary/30 has-[:checked]:bg-primary/[0.06]"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                      className="h-4 w-4 shrink-0 border-primary/30 text-primary"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-primary/20 bg-white px-5 py-2 text-sm font-medium text-foreground transition hover:bg-primary/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92 disabled:opacity-60"
            >
              {busy ? "Working…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function JoinMeetButton({ event }: { event: MeetEvent }) {
  const router = useRouter();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const user = useSessionStore((s) => s.user);
  const accessToken = useSessionStore((s) => s.accessToken);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const tryJoinEvent = useSessionStore((s) => s.tryJoinEvent);
  const [preJoinOpen, setPreJoinOpen] = useState(false);
  const [preJoinKey, setPreJoinKey] = useState(0);
  const [modalEvent, setModalEvent] = useState<MeetEvent>(event);
  const [joinBusy, setJoinBusy] = useState(false);

  const resolveLatest = (): MeetEvent =>
    getEventFromCatalog(event.id, hostedEvents, circleCatalogEvents) ?? event;

  const useCircleApply =
    resolveLatest().cityId === "circle" &&
    isCircleApiConfigured() &&
    Boolean(accessToken);

  const runMockJoin = (
    latest: MeetEvent,
    preJoinAnswers?: Record<string, string>,
  ) => {
    const result = tryJoinEvent(latest, preJoinAnswers);
    if (!result.ok) {
      toast.error(result.reason ?? "Could not join");
      return;
    }
    if (result.booking?.status === "pending") {
      toast.success("Request sent — the host will review (mock).");
    } else {
      toast.success("You’re in — mock booking confirmed.");
    }
    router.push("/bookings");
  };

  const runCircleJoin = async (
    latest: MeetEvent,
    preJoinAnswers: Record<string, string>,
  ) => {
    if (!accessToken) {
      toast.error("Sign in again to continue.");
      return;
    }
    if (user?.isProfileComplete === false) {
      toast.error("Complete your profile before joining paid meets.");
      router.push(
        `/signup?returnUrl=${encodeURIComponent(`/event/${latest.id}`)}`,
      );
      return;
    }
    setJoinBusy(true);
    try {
      const answers = Object.entries(preJoinAnswers).map(
        ([question_id, answer]) => ({
          question_id,
          answer,
        }),
      );
      const data = await applyToEvent(accessToken, latest.id, { answers });
      if (data.waitlisted) {
        toast.success(
          `You’re on the waitlist (position ${data.waitlist_position ?? "—"}).`,
        );
        router.push("/bookings");
        return;
      }
      const pay = data.payment;
      const needsPay = canOpenRazorpayCheckout(pay);
      if (needsPay) {
        await openRazorpayFromPayload({
          payload: pay,
          title: latest.title,
          onPaid: () => {
            toast.success(
              "Payment submitted — your booking will update shortly.",
            );
          },
          onDismiss: () => {
            toast.message("Checkout closed — you can complete payment from Bookings.");
          },
        });
        router.push("/bookings");
        return;
      }
      toast.success("Application submitted.");
      router.push("/bookings");
    } catch (e) {
      const msg =
        e instanceof CircleApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not apply";
      toast.error(msg);
    } finally {
      setJoinBusy(false);
    }
  };

  const label =
    (event.joinMode ?? "open") === "invite"
      ? "Request to join"
      : "Join this meet";

  return (
    <>
      <PrimaryButton
        label={joinBusy ? "Working…" : label}
        onClick={async () => {
          if (!isAuthenticated || !user) {
            router.push(`/login?returnUrl=/event/${event.id}`);
            return;
          }
          let latest = resolveLatest();
          if (!useCircleApply) {
            const qs = latest.preJoinQuestions ?? [];
            if (qs.length > 0) {
              setModalEvent(latest);
              setPreJoinKey((k) => k + 1);
              setPreJoinOpen(true);
              return;
            }
            runMockJoin(latest);
            return;
          }
          if (user.isProfileComplete === false) {
            toast.error("Complete your profile before joining paid meets.");
            router.push(
              `/signup?returnUrl=${encodeURIComponent(`/event/${latest.id}`)}`,
            );
            return;
          }
          if (!(latest.preJoinQuestions?.length)) {
            try {
              const remote = await getEventQuestions(latest.id);
              const mapped = mapRemoteQuestionsToPreJoin(remote);
              if (mapped.length > 0) {
                latest = { ...latest, preJoinQuestions: mapped };
              }
            } catch {
              /* proceed with no questions */
            }
          }
          const qs = latest.preJoinQuestions ?? [];
          if (qs.length > 0) {
            setModalEvent(latest);
            setPreJoinKey((k) => k + 1);
            setPreJoinOpen(true);
            return;
          }
          await runCircleJoin(latest, {});
        }}
        className="!min-w-[200px]"
      />
      <PreJoinModal
        key={preJoinKey}
        event={modalEvent}
        open={preJoinOpen}
        busy={joinBusy}
        onClose={() => {
          if (!joinBusy) setPreJoinOpen(false);
        }}
        onConfirm={async (answers) => {
          const latest = resolveLatest();
          const merged = {
            ...latest,
            preJoinQuestions:
              modalEvent.preJoinQuestions ?? latest.preJoinQuestions,
          };
          setPreJoinOpen(false);
          if (!useCircleApply) {
            runMockJoin(merged, answers);
            return;
          }
          await runCircleJoin(merged, answers);
        }}
      />
    </>
  );
}
