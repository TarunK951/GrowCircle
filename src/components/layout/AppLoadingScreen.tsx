import { GrowCircleWordmark } from "@/components/brand/GrowCircleWordmark";

/**
 * Full-viewport loading UI: Grow Circle logo + indeterminate bar.
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
      <GrowCircleWordmark className="h-16 w-auto sm:h-20" />
      <div className="h-1.5 w-full max-w-[min(20rem,85vw)] overflow-hidden rounded-full bg-neutral-300/80">
        <div className="gc-load-bar-sweep h-full w-2/5 rounded-full bg-brand shadow-[0_0_14px_color-mix(in_srgb,var(--brand)_40%,transparent)]" />
      </div>
    </div>
  );
}
