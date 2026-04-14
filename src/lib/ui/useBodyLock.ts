import { useEffect } from "react";

/** Sets `document.body.style.overflow = 'hidden'` while `locked`; restores previous value on cleanup. */
export function useBodyLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
