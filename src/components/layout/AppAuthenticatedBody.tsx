"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BookingsStandaloneLayout } from "@/components/layout/BookingsStandaloneLayout";
import { CircleSessionBridge } from "@/components/providers/CircleSessionBridge";

/** Full-width main column without the left icon sidebar (content was feeling indented). */
function hideAppSidebar(pathname: string): boolean {
  return (
    pathname === "/profile" ||
    pathname === "/saved" ||
    pathname === "/reviews" ||
    pathname === "/settings"
  );
}

const shellLessMainClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-8 text-neutral-900 sm:px-6 lg:px-8";

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

  if (hideAppSidebar(pathname)) {
    return (
      <>
        <CircleSessionBridge />
        <div className={`mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col ${shellLessMainClass}`}>
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      <CircleSessionBridge />
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <AppShell>{children}</AppShell>
      </div>
    </>
  );
}
