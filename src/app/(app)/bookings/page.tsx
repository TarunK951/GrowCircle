"use client";

import { useEffect } from "react";
import { BookingsHub } from "@/components/bookings/BookingsHub";
import { useSessionStore } from "@/stores/session-store";

export default function BookingsPage() {
  const user = useSessionStore((s) => s.user);
  const seedDemoBookingData = useSessionStore((s) => s.seedDemoBookingData);

  useEffect(() => {
    if (user) seedDemoBookingData();
  }, [user, seedDemoBookingData]);

  return <BookingsHub />;
}
