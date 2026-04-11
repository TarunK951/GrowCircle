/**
 * Full-viewport loading UI: brand ring + “GROW / CIRCLE” outlined text with a
 * left-to-right fill sweep. Used by `app/loading.tsx` for route-level loading.
 */
export function AppLoadingScreen() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading Grow Circle</span>
      <div className="flex items-center gap-4 sm:gap-5">
        <div
          className="relative size-[3.25rem] shrink-0 rounded-full bg-brand shadow-[0_0_20px_color-mix(in_srgb,var(--brand)_28%,transparent)] sm:size-16"
          aria-hidden
        >
          <div className="absolute inset-0 m-auto size-[42%] rounded-full bg-white" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="gc-word-fill">Grow</span>
          <span className="gc-word-fill">Circle</span>
        </div>
      </div>
    </div>
  );
}
