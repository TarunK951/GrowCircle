"use client";

import { MessagesPanel } from "@/components/messages/MessagesPanel";

export default function MessagesPage() {
  return (
    <div className="w-full text-neutral-900">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Local threads for meets you join or host. Circle DMs are not wired yet;
          use Notifications for real backend updates.
        </p>
      </div>
      <MessagesPanel />
    </div>
  );
}
