"use client";

import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { SOCIAL_PLATFORMS } from "@/lib/socialLinks";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";

export default function SocialPage() {
  const socialConnections = useSessionStore((s) => s.socialConnections);
  const toggleSocialConnection = useSessionStore(
    (s) => s.toggleSocialConnection,
  );

  return (
    <div className="mx-auto max-w-2xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-8">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          Social
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-800">
          Link accounts for your profile (demo only — toggles are stored in this
          browser). Open a platform in a new tab or use Connect to simulate
          linking.
        </p>
      </div>

      <ul className="mt-10 flex flex-col gap-3">
        {SOCIAL_PLATFORMS.map((p) => {
          const linked = socialConnections[p.id] === true;
          return (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-onest text-lg font-semibold text-neutral-900 underline-offset-2 hover:text-primary hover:underline"
                  >
                    {p.label}
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-70" />
                  </a>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      linked
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-neutral-200 text-neutral-600",
                    )}
                  >
                    {linked ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-600">
                  Opens the official {p.label} site in a new tab.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleSocialConnection(p.id);
                  toast.success(
                    linked
                      ? `Disconnected ${p.label} (mock)`
                      : `Connected ${p.label} (mock)`,
                  );
                }}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  linked
                    ? "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
                    : "bg-neutral-900 text-white hover:bg-neutral-800",
                )}
              >
                {linked ? "Disconnect" : "Connect"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
