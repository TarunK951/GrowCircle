"use client";

import { useSessionStore } from "@/stores/session-store";

export function HomeHeroBackdrop() {
  const showGlass = useSessionStore((s) => s.uiPrefs.showLiquidGlassHero);

  if (!showGlass) {
    return (
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(251,252,248,0.98)_0%,rgba(251,252,248,1)_100%)]"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,59,189,0.08),transparent_55%)]"
      aria-hidden
    />
  );
}
