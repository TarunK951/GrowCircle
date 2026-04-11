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
    <div className="mt-10 max-w-xl rounded-2xl border border-primary/10 bg-white/50 p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Step {step + 1} / 3
      </p>
      {step === 0 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-xl border border-primary/15 px-3 py-2"
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
              className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
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
              className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
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
              className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
              value={draft.startsAt}
              onChange={(e) =>
                setDraft((d) => ({ ...d, startsAt: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Venue name</label>
            <input
              className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
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
              className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
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
          className="rounded-xl border border-primary/15 px-4 py-2 text-sm disabled:opacity-40"
        >
          Back
        </button>
        {step < 2 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Publish (mock)
          </button>
        )}
      </div>
    </div>
  );
}
