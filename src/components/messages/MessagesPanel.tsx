"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Calendar,
  ChevronLeft,
  MessageCircle,
  Send,
  Settings,
  Users,
} from "lucide-react";
import { getEventFromCatalog } from "@/lib/eventsCatalog";
import { cn } from "@/lib/utils";
import { selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import type { ChatMessage, MeetEvent } from "@/lib/types";
import { useSessionStore } from "@/stores/session-store";

export function threadIdForMeet(role: "guest" | "host", eventId: string) {
  return `${role}:${eventId}`;
}

type ThreadRow = {
  id: string;
  role: "guest" | "host";
  eventId: string;
  title: string;
  subtitle: string;
  startsAt: string;
  image?: string;
};

function formatShortTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function hostLabel(event: MeetEvent) {
  if (event.hostUsername?.trim()) return event.hostUsername.trim();
  return "Host";
}

const LG_MQ = "(min-width: 1024px)";

export function MessagesPanel() {
  const user = useAppSelector(selectUser);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const chatExtras = useSessionStore((s) => s.chatExtras);
  const appendChatMessage = useSessionStore((s) => s.appendChatMessage);
  const blockedIds = useSessionStore((s) => s.blockedMessageThreadIds);
  const blockMessageThread = useSessionStore((s) => s.blockMessageThread);
  const unblockMessageThread = useSessionStore((s) => s.unblockMessageThread);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(LG_MQ);
    setIsLg(mq.matches);
    const onChange = () => setIsLg(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const threads = useMemo(() => {
    if (!user) return [];
    const rows: ThreadRow[] = [];
    const seenGuest = new Set<string>();

    for (const b of bookings) {
      if (b.userId !== user.id) continue;
      if (b.status === "cancelled") continue;
      const event = getEventFromCatalog(
        b.eventId,
        hostedEvents,
        circleCatalogEvents,
      );
      if (!event || event.cancelledAt) continue;
      const id = threadIdForMeet("guest", event.id);
      if (seenGuest.has(id)) continue;
      seenGuest.add(id);
      rows.push({
        id,
        role: "guest",
        eventId: event.id,
        title: event.title,
        subtitle: `Host · ${hostLabel(event)}`,
        startsAt: event.startsAt,
        image: event.image,
      });
    }

    for (const event of hostedEvents) {
      if (event.cancelledAt) continue;
      rows.push({
        id: threadIdForMeet("host", event.id),
        role: "host",
        eventId: event.id,
        title: event.title,
        subtitle: "Guests & coordination",
        startsAt: event.startsAt,
        image: event.image,
      });
    }

    rows.sort(
      (a, b) =>
        new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );
    return rows;
  }, [bookings, circleCatalogEvents, hostedEvents, user]);

  const activeThreads = useMemo(
    () => threads.filter((t) => !blockedIds.includes(t.id)),
    [threads, blockedIds],
  );

  const blockedThreads = useMemo(
    () => threads.filter((t) => blockedIds.includes(t.id)),
    [threads, blockedIds],
  );

  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId],
  );

  useEffect(() => {
    if (selectedId && !threads.some((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, threads]);

  useEffect(() => {
    if (!isLg) return;
    if (!selectedId && activeThreads.length > 0) {
      setSelectedId(activeThreads[0].id);
    }
  }, [activeThreads, selectedId, isLg]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const lock = Boolean(selectedId && !isLg);
    if (!lock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedId, isLg]);

  const messages: ChatMessage[] = selected
    ? chatExtras[selected.id] ?? []
    : [];

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, selectedId, scrollToBottom]);

  const send = () => {
    if (!user || !selected) return;
    const body = draft.trim();
    if (!body) return;
    const msg: ChatMessage = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      threadId: selected.id,
      senderId: user.id,
      body,
      sentAt: new Date().toISOString(),
    };
    appendChatMessage(selected.id, msg);
    setDraft("");
  };

  const onBlock = () => {
    if (!selected) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Block this thread? You can unblock it from the list below.",
      )
    ) {
      return;
    }
    blockMessageThread(selected.id);
    setSelectedId(null);
  };

  const peerLabel = (msg: ChatMessage) => {
    if (!selected || !user) return "Member";
    if (msg.senderId === user.id) return "You";
    if (selected.role === "guest") {
      const ev = getEventFromCatalog(
        selected.eventId,
        hostedEvents,
        circleCatalogEvents,
      );
      return ev ? hostLabel(ev) : "Host";
    }
    return "Guest";
  };

  const renderChatPane = (opts?: { mobileBack?: () => void }) => {
    if (!selected) return null;
    const sel = selected;
    return (
      <>
        {opts?.mobileBack ? (
          <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2.5 lg:hidden">
            <button
              type="button"
              onClick={opts.mobileBack}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
              Threads
            </button>
          </div>
        ) : null}

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-neutral-900">
              {sel.title}
            </h2>
            <p className="text-xs text-neutral-500">{sel.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/settings"
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden />
              Settings
            </Link>
            <button
              type="button"
              onClick={onBlock}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100"
            >
              <Ban className="h-3.5 w-3.5" aria-hidden />
              Block
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            In-app messaging is not connected to Circle yet. Messages stay in
            this browser for demo threads only; event updates still appear under
            Notifications when the backend is connected.
          </div>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-neutral-600">
                No messages in this thread yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("message-composer");
                  el?.focus();
                }}
                className="mt-4 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                Start a message
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => {
                const mine = user && m.senderId === user.id;
                return (
                  <li
                    key={m.id}
                    className={cn(
                      "flex",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        mine
                          ? "bg-neutral-900 text-white"
                          : "border border-neutral-200 bg-neutral-50 text-neutral-900",
                      )}
                    >
                      <p className="text-[10px] font-medium opacity-80">
                        {peerLabel(m)}
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          mine ? "text-neutral-300" : "text-neutral-500",
                        )}
                      >
                        {formatShortTime(m.sentAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
              <div ref={listEndRef} />
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-neutral-200 p-3 sm:p-4">
          <div className="flex gap-2">
            <textarea
              id="message-composer"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Write a message…"
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim()}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center self-end rounded-xl bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="relative flex min-h-[min(72vh,680px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:h-[min(72vh,680px)] lg:min-h-0 lg:flex-row">
      <div
        className={cn(
          "flex min-h-0 flex-col overflow-hidden border-b border-neutral-200",
          "h-[min(42vh,400px)] w-full lg:h-full lg:min-h-0 lg:w-[min(100%,340px)] lg:shrink-0 lg:border-b-0 lg:border-r",
        )}
      >
        <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">
            People & meets
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Threads tied to your bookings and hosted meets (stored on this
            device).
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {activeThreads.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageCircle
                className="mx-auto h-10 w-10 text-neutral-300"
                aria-hidden
              />
              <p className="mt-3 text-sm font-medium text-neutral-900">
                No conversations yet
              </p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Join a meet or host one — threads appear here for each event.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  href="/explore"
                  className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  Explore meets
                </Link>
                <Link
                  href="/bookings"
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
                >
                  Bookings
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {activeThreads.map((t) => {
                const extras = chatExtras[t.id] ?? [];
                const last = extras[extras.length - 1];
                const isActive = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition",
                        isActive
                          ? "bg-neutral-100"
                          : "hover:bg-neutral-50",
                      )}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                        {t.image ? (
                          <Image
                            src={t.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                            {t.role === "host" ? (
                              <Users className="h-4 w-4" aria-hidden />
                            ) : (
                              <Calendar className="h-4 w-4" aria-hidden />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {t.title}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {t.subtitle}
                        </p>
                        {last ? (
                          <p className="mt-0.5 truncate text-xs text-neutral-600">
                            {last.body}
                          </p>
                        ) : null}
                      </div>
                      {last ? (
                        <span className="shrink-0 text-[10px] text-neutral-400">
                          {formatShortTime(last.sentAt)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {blockedThreads.length > 0 ? (
            <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Blocked ({blockedThreads.length})
              </p>
              <ul className="mt-2 space-y-1">
                {blockedThreads.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs"
                  >
                    <span className="min-w-0 truncate font-medium text-neutral-800">
                      {t.title}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold text-blue-700 hover:underline"
                      onClick={() => unblockMessageThread(t.id)}
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden min-h-0 min-w-0 flex-1 flex-col lg:flex lg:h-full lg:min-h-0">
        {selected ? (
          <div className="flex min-h-0 flex-1 flex-col">{renderChatPane()}</div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <MessageCircle
              className="h-12 w-12 text-neutral-200"
              aria-hidden
            />
            <p className="mt-4 text-lg font-semibold text-neutral-900">
              Messages
            </p>
            <p className="mt-2 max-w-sm text-sm text-neutral-600">
              Select a meet thread on the left, or join a meet to start
              messaging.
            </p>
            <Link
              href="/explore"
              className="mt-6 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              Start a message — explore meets
            </Link>
          </div>
        )}
      </div>

      {selected && !isLg ? (
        <div
          className="fixed inset-0 z-200 flex min-h-0 flex-col bg-white lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Conversation"
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {renderChatPane({ mobileBack: () => setSelectedId(null) })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
