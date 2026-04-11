import Link from "next/link";

/**
 * Full-width Bookings experience — not nested in the account sidebar.
 */
export function BookingsStandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white text-foreground">
      <header className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
              Bookings
            </p>
            <h1 className="font-onest mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Your meets & guests
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-900">
              Manage trips you&apos;ve booked and meets you host. Data stays in
              this browser (demo).
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 text-neutral-900 sm:px-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
