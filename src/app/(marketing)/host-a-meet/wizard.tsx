"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";
import {
  initialHostDraft,
  useSessionStore,
} from "@/stores/session-store";

const cities = citiesData as City[];

export function HostWizard() {
  const router = useRouter();
  const setHostDraft = useSessionStore((s) => s.setHostDraft);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialHostDraft());

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    setHostDraft(draft);
    toast.success("Meet drafted — check your dashboard (mock).");
    router.push("/dashboard");
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
        </div>
      )}
      {step === 2 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Starts at (ISO-ish)</label>
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
