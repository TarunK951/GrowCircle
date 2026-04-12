"use client";

import { useRouter } from "next/navigation";

/**
 * Prefers browser back; if there is no prior history entry, goes to marketing home.
 */
export function BookingsBackHome() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="shrink-0 text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
    >
      ← Back to home
    </button>
  );
}
