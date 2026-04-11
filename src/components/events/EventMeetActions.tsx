"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PrimaryButton, SecondaryButton } from "@/components/ui/MarketingButton";
import type { MeetEvent } from "@/lib/types";
import { getEventFromCatalog } from "@/lib/eventsCatalog";
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

function PreJoinModal({
  event,
  open,
  onClose,
  onConfirm,
}: {
  event: MeetEvent;
  open: boolean;
  onClose: () => void;
  onConfirm: (answers: Record<string, string>) => void;
}) {
  const questions = event.preJoinQuestions ?? [];
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setAnswers({});
  }, [open, event.id]);

  if (!open) return null;

  const setAnswer = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const q of questions) {
      if (!answers[q.id]?.trim()) {
        toast.error("Please answer every question.");
        return;
      }
    }
    onConfirm(answers);
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
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92"
            >
              Continue
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
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const tryJoinEvent = useSessionStore((s) => s.tryJoinEvent);
  const [preJoinOpen, setPreJoinOpen] = useState(false);

  const runJoin = (latest: MeetEvent, preJoinAnswers?: Record<string, string>) => {
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

  const label =
    (event.joinMode ?? "open") === "invite"
      ? "Request to join"
      : "Join this meet";

  return (
    <>
      <PrimaryButton
        label={label}
        onClick={() => {
          if (!isAuthenticated || !user) {
            router.push(`/login?returnUrl=/event/${event.id}`);
            return;
          }
          const latest = getEventFromCatalog(event.id, hostedEvents) ?? event;
          const qs = latest.preJoinQuestions ?? [];
          if (qs.length > 0) {
            setPreJoinOpen(true);
            return;
          }
          runJoin(latest);
        }}
        className="!min-w-[200px]"
      />
      <PreJoinModal
        event={getEventFromCatalog(event.id, hostedEvents) ?? event}
        open={preJoinOpen}
        onClose={() => setPreJoinOpen(false)}
        onConfirm={(answers) => {
          const latest = getEventFromCatalog(event.id, hostedEvents) ?? event;
          setPreJoinOpen(false);
          runJoin(latest, answers);
        }}
      />
    </>
  );
}
