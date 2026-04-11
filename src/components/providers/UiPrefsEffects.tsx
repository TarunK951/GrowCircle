"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/stores/session-store";

/** Syncs reduce-motion preference to the document root for global CSS. */
export function UiPrefsEffects() {
  const reduceMotion = useSessionStore((s) => s.uiPrefs.reduceMotionUi);

  useEffect(() => {
    document.documentElement.classList.toggle("gc-reduce-motion", reduceMotion);
  }, [reduceMotion]);

  return null;
}
