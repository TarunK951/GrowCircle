"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PrimaryButton, SecondaryButton } from "@/components/ui/MarketingButton";
import { makeBookingRecord } from "@/lib/mockApi";
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

export function JoinMeetButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const user = useSessionStore((s) => s.user);
  const addBooking = useSessionStore((s) => s.addBooking);

  return (
    <PrimaryButton
      label="Join this meet"
      onClick={() => {
        if (!isAuthenticated || !user) {
          router.push(`/login?returnUrl=/event/${eventId}`);
          return;
        }
        const b = makeBookingRecord(user.id, eventId);
        addBooking(b);
        toast.success("You’re in — mock booking confirmed.");
        router.push("/my-events");
      }}
      className="!min-w-[200px]"
    />
  );
}
