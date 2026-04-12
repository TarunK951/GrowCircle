import { BookingsBackHome } from "@/components/layout/BookingsBackHome";

/**
 * Full-width Bookings experience — not nested in the account sidebar.
 */
export function BookingsStandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white text-foreground">
      <header className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-5 lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
              Bookings
            </p>
            <h1 className="font-onest mt-1 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Bookings & hosting
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-neutral-900">
              Trips you&apos;ve booked and meets you host — stored in this browser
              for testing (demo).
            </p>
          </div>
          <BookingsBackHome />
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 text-neutral-900 sm:px-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
