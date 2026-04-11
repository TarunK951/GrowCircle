"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [digest, setDigest] = useState(true);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-muted">Local preferences — not synced to a server.</p>
      <div className="mt-8 space-y-4 rounded-2xl border border-primary/10 bg-white/50 p-6">
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Weekly digest email (mock)</span>
          <input
            type="checkbox"
            checked={digest}
            onChange={(e) => {
              setDigest(e.target.checked);
              toast.success("Preference saved locally");
            }}
          />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Show liquid glass hero on home</span>
          <input type="checkbox" defaultChecked readOnly />
        </label>
      </div>
    </div>
  );
}
