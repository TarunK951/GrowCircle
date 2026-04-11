"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BookingsStandaloneLayout } from "@/components/layout/BookingsStandaloneLayout";

export function AppAuthenticatedBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHistory =
    pathname === "/history" ||
    pathname === "/bookings" ||
    pathname === "/my-events";

  if (isHistory) {
    return (
      <BookingsStandaloneLayout>{children}</BookingsStandaloneLayout>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AppShell>{children}</AppShell>
    </div>
  );
}
