"use client";

import { useMemo, useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import threadsSeed from "@/data/threads.seed.json";
import type { ChatMessage, ChatThread } from "@/lib/types";
import { toast } from "sonner";
import { createLocalId } from "@/lib/id";

export default function MessagesPage() {
  const user = useSessionStore((s) => s.user);
  const extras = useSessionStore((s) => s.chatExtras);
  const append = useSessionStore((s) => s.appendChatMessage);
  const threads = threadsSeed as ChatThread[];
  const [activeId, setActiveId] = useState(threads[0]?.id ?? "");

  const merged = useMemo(() => {
    return threads.map((t) => ({
      ...t,
      messages: [...t.messages, ...(extras[t.id] ?? [])],
    }));
  }, [threads, extras]);

  const active = merged.find((t) => t.id === activeId);
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim() || !user || !active) return;
    const msg: ChatMessage = {
      id: createLocalId("m"),
      threadId: active.id,
      senderId: user.id,
      body: draft.trim(),
      sentAt: new Date().toISOString(),
    };
    append(active.id, msg);
    setDraft("");
    toast.success("Sent (local only)");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div>
        <h1 className="text-xl font-semibold">Messages</h1>
        <ul className="mt-4 space-y-1">
          {merged.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setActiveId(t.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  t.id === activeId ? "bg-primary/10 font-medium text-primary" : ""
                }`}
              >
                {t.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-h-[320px] rounded-2xl border border-primary/10 bg-white/50 p-4">
        {active ? (
          <>
            <p className="text-sm font-semibold">{active.title}</p>
            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
              {active.messages.map((m) => {
                const own =
                  m.senderId === user?.id || m.senderId === "me";
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      own
                        ? "ml-auto max-w-[85%] bg-primary/10 text-right"
                        : "mr-auto max-w-[85%] bg-canvas"
                    }`}
                  >
                    {m.body}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-primary/15 px-3 py-2 text-sm"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                type="button"
                onClick={send}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-900">Select a thread</p>
        )}
      </div>
    </div>
  );
}
