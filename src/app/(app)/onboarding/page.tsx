"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";
import { useSessionStore } from "@/stores/session-store";

const cities = citiesData as City[];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const updateProfile = useSessionStore((s) => s.updateProfile);
  const [cityId, setCityId] = useState(user?.cityId ?? "sf");
  const [interests, setInterests] = useState(
    user?.interests?.join(", ") ?? "",
  );

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome aboard</h1>
      <p className="mt-2 text-muted">
        Tell us a bit about you — stored only in this browser session.
      </p>
      <div className="mt-8 space-y-4 rounded-2xl border border-primary/10 bg-white/50 p-6">
        <div>
          <label className="text-sm font-medium">Home city</label>
          <select
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
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
          <label className="text-sm font-medium">Interests (comma separated)</label>
          <input
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </div>
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
            router.push("/dashboard");
          }}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white"
        >
          Finish
        </button>
      </div>
    </div>
  );
}
