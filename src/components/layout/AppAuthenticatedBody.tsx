"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BookingsStandaloneLayout } from "@/components/layout/BookingsStandaloneLayout";
import { CircleSessionBridge } from "@/components/providers/CircleSessionBridge";

export function AppAuthenticatedBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBookingsHub =
    pathname === "/bookings" || pathname === "/my-events";

  if (isBookingsHub) {
    return (
      <>
        <CircleSessionBridge />
        <BookingsStandaloneLayout>{children}</BookingsStandaloneLayout>
      </>
    );
  }

  return (
    <>
      <CircleSessionBridge />
      <div className="mx-auto w-full max-w-6xl">
        <AppShell>{children}</AppShell>
      </div>
    </>
  );
}
