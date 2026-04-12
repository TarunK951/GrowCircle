"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";
import { useSessionStore } from "@/stores/session-store";

const cities = (citiesData as City[]).filter((c) => c.id !== "circle");

export default function OnboardingPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const updateProfile = useSessionStore((s) => s.updateProfile);
  const [cityId, setCityId] = useState(user?.cityId ?? "blr");
  const [interests, setInterests] = useState(
    user?.interests?.join(", ") ?? "",
  );

  const goDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
          Preferences
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Home city and interests — stored in this browser only.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Home city
            </label>
            <select
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Interests (comma separated)
            </label>
            <input
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. art, running, startups"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={goDashboard}
            className="order-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:order-1 sm:mr-auto"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => {
              updateProfile({
                cityId,
                interests: interests
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              });
              toast.success("Preferences saved");
              goDashboard();
            }}
            className="order-1 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:order-2"
          >
            Save & continue
          </button>
        </div>
      </div>
    </div>
  );
}
