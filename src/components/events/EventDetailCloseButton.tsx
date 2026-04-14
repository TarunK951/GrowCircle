"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const FALLBACK = "/explore";

export function EventDetailCloseButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(FALLBACK);
        }
      }}
      aria-label="Close and go back"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm transition hover:bg-neutral-50"
    >
      <X className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
