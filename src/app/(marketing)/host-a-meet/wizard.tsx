"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import citiesData from "@/data/cities.json";
import { generateShareToken } from "@/lib/eventsCatalog";
import type { City, MeetEvent } from "@/lib/types";
import {
  initialHostDraft,
  useSessionStore,
} from "@/stores/session-store";

const cities = citiesData as City[];

export function HostWizard() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const publishHostedEvent = useSessionStore((s) => s.publishHostedEvent);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialHostDraft());

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    if (!isAuthenticated || !user) {
      toast.error("Sign in to publish a meet.");
      router.push("/login?returnUrl=/host-a-meet");
      return;
    }
    const startsAtIso = draft.startsAt
      ? new Date(draft.startsAt).toISOString()
      : new Date(Date.now() + 864e5).toISOString();

    const ev: MeetEvent = {
      id: `evt_u_${Math.random().toString(36).slice(2, 11)}`,
      title: draft.title.trim() || "Untitled meet",
      description: draft.description.trim() || "—",
      cityId: draft.cityId,
      startsAt: startsAtIso,
      hostUserId: user.id,
      capacity: Math.max(4, draft.capacity),
      category: draft.category,
      image:
        "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80",
      priceCents: Math.max(0, draft.priceCents),
      venueName: draft.venueName.trim() || undefined,
      joinMode: draft.joinMode,
      listingVisibility: draft.listingVisibility,
      shareToken: generateShareToken(),
      spotsTaken: 0,
    };
    publishHostedEvent(ev);
    toast.success("Meet published (mock) — manage it under Bookings.");
    router.push("/bookings");
  };

  return (
    <div className="liquid-glass-surface mt-10 max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
        Step {step + 1} / 3
      </p>
      {step === 0 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              className="liquid-glass-input mt-2"
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="liquid-glass-input mt-2 min-h-[100px] resize-y"
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">City</label>
            <select
              className="liquid-glass-input mt-2"
              value={draft.cityId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, cityId: e.target.value }))
              }
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              className="liquid-glass-input mt-2"
              value={draft.category}
              onChange={(e) =>
                setDraft((d) => ({ ...d, category: e.target.value }))
              }
            >
              {["Social", "Professional", "Culture", "Wellness", "Games"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Join policy</label>
            <select
              className="liquid-glass-input mt-2"
              value={draft.joinMode}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  joinMode: e.target.value as "open" | "invite",
                }))
              }
            >
              <option value="open">Open — anyone can join instantly</option>
              <option value="invite">
                Invite — guests request; you approve
              </option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Listing</label>
            <select
              className="liquid-glass-input mt-2"
              value={draft.listingVisibility}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  listingVisibility: e.target.value as "public" | "private",
                }))
              }
            >
              <option value="public">Public — shown on Explore</option>
              <option value="private">Private — link only</option>
            </select>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Starts at</label>
            <input
              type="datetime-local"
              className="liquid-glass-input mt-2"
              value={draft.startsAt}
              onChange={(e) =>
                setDraft((d) => ({ ...d, startsAt: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Venue name</label>
            <input
              className="liquid-glass-input mt-2"
              value={draft.venueName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, venueName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Capacity</label>
            <input
              type="number"
              min={4}
              className="liquid-glass-input mt-2"
              value={draft.capacity}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  capacity: Number(e.target.value) || 8,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Price (cents)</label>
            <input
              type="number"
              min={0}
              step={100}
              className="liquid-glass-input mt-2"
              value={draft.priceCents}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  priceCents: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
            <p className="mt-1 text-xs text-muted">
              e.g. 2500 = $25.00 (mock — no real charge).
            </p>
          </div>
        </div>
      )}
      <div className="mt-8 flex justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="rounded-full border border-primary/20 bg-white/40 px-5 py-2 text-sm font-medium transition hover:bg-primary/5 disabled:opacity-40"
        >
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92"
          >
            Publish (mock)
          </button>
        )}
      </div>
    </div>
  );
}
