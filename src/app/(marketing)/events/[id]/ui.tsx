"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GlassyButton from "@/components/ui/GlassyButton";
import { makeBookingRecord } from "@/lib/mockApi";
import { useSessionStore } from "@/stores/session-store";

export function SaveEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const saved = useSessionStore((s) => s.savedEventIds.includes(eventId));
  const toggleSaved = useSessionStore((s) => s.toggleSaved);

  return (
    <div className="h-12 w-[160px]">
      <GlassyButton
        label={saved ? "Saved" : "Save meet"}
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            router.push(`/login?returnUrl=/events/${eventId}`);
            return;
          }
          toggleSaved(eventId);
          toast.success(saved ? "Removed from saved" : "Saved for later");
        }}
      />
    </div>
  );
}

export function JoinMeetButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const user = useSessionStore((s) => s.user);
  const addBooking = useSessionStore((s) => s.addBooking);

  return (
    <div className="h-12 w-[200px]">
      <GlassyButton
        label="Join this meet"
        type="button"
        onClick={() => {
          if (!isAuthenticated || !user) {
            router.push(`/login?returnUrl=/events/${eventId}`);
            return;
          }
          const b = makeBookingRecord(user.id, eventId);
          addBooking(b);
          toast.success("You’re in — mock booking confirmed.");
          router.push("/bookings");
        }}
      />
    </div>
  );
}
