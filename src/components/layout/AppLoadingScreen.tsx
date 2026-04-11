import Image from "next/image";

/**
 * Full-viewport loading UI: Grow Circle logo + blue ring spinner + indeterminate bar.
 * Used by `app/loading.tsx` for route-level loading states.
 */
export function AppLoadingScreen() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-canvas px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>
      <div className="rounded-2xl bg-black p-4 shadow-xl sm:p-5">
        <Image
          src="/brand-grow-circle-logo.png"
          alt="Grow Circle"
          width={280}
          height={84}
          className="h-16 w-auto sm:h-20"
          priority
        />
      </div>
      <div className="flex w-full max-w-[min(20rem,85vw)] flex-col items-center gap-5">
        <div className="relative h-14 w-14" aria-hidden>
          <div className="absolute inset-0 rounded-full border-[3px] border-brand/25" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-brand"
            style={{ animationDuration: "0.85s" }}
          />
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-300/80">
          <div className="gc-load-bar-sweep h-full w-2/5 rounded-full bg-brand shadow-[0_0_14px_color-mix(in_srgb,var(--brand)_40%,transparent)]" />
        </div>
      </div>
    </div>
  );
}
