"use client";

import { useState } from "react";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function HostMeetCircleBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || isCircleApiConfigured()) return null;

  return (
    <div
      className={cn(
        "mb-6 w-full max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-neutral-900 shadow-sm",
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <p className="min-w-0 flex-1 leading-relaxed">
          <span className="font-semibold">Publishing needs the Circle API.</span>{" "}
          Add{" "}
          <code className="rounded bg-white/80 px-1 py-0.5 text-xs font-mono">
            NEXT_PUBLIC_CIRCLE_API_BASE
          </code>{" "}
          to <code className="rounded bg-white/80 px-1 py-0.5 text-xs font-mono">.env.local</code>{" "}
          and restart the dev server. You can still fill out the wizard; progress is saved in this
          browser.
        </p>
        <button
          type="button"
          className="shrink-0 rounded-full p-1 text-neutral-600 transition hover:bg-amber-100/80 hover:text-neutral-900"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
