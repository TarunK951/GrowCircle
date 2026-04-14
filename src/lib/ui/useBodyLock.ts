import { useEffect } from "react";

/**
 * Locks document scroll while `locked` (marketing layouts often scroll the viewport;
 * setting both `html` and `body` avoids wheel/touch chaining to the page behind overlays).
 */
export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [locked]);
}
