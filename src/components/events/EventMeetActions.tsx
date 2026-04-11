"use client";

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

export function JoinMeetButton({ event }: { event: MeetEvent }) {
  const router = useRouter();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const user = useSessionStore((s) => s.user);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const tryJoinEvent = useSessionStore((s) => s.tryJoinEvent);

  return (
    <PrimaryButton
      label={
        (event.joinMode ?? "open") === "invite"
          ? "Request to join"
          : "Join this meet"
      }
      onClick={() => {
        if (!isAuthenticated || !user) {
          router.push(`/login?returnUrl=/event/${event.id}`);
          return;
        }
        const latest = getEventFromCatalog(event.id, hostedEvents) ?? event;
        const result = tryJoinEvent(latest);
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
      }}
      className="!min-w-[200px]"
    />
  );
}
