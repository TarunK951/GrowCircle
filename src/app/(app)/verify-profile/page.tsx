"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/session-store";

export default function VerifyProfilePage() {
  const setVerified = useSessionStore((s) => s.setVerified);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState(0);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Verify profile</h1>
      <p className="mt-2 text-muted">
        Verify to earn a trusted badge on your profile. Simulated steps — no
        SMS or document upload hits a server.
      </p>
      <div className="mt-8 rounded-2xl border border-primary/10 bg-white/50 p-6">
        <p className="text-xs font-semibold uppercase text-muted">
          Step {step + 1} / 2
        </p>
        {step === 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium">Phone (mock)</label>
            <input
              className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
            />
            <button
              type="button"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                toast.success("Code sent (mock)");
                setStep(1);
              }}
            >
              Send code
            </button>
          </div>
        )}
        {step === 1 && (
          <div className="mt-4">
            <label className="text-sm font-medium">Enter code</label>
            <input
              className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              placeholder="123456"
            />
            <label className="mt-4 block text-sm font-medium">
              Photo (optional)
            </label>
            <input type="file" accept="image/*" className="mt-1 text-sm" />
            <button
              type="button"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setVerified(true);
                toast.success("Profile verified (mock)");
              }}
            >
              Complete verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
