"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getEventFromCatalog,
  mergeEventCatalog,
} from "@/lib/eventsCatalog";
import { lookupUser } from "@/lib/userLookup";
import { useSessionStore } from "@/stores/session-store";
import type { Booking, MeetEvent } from "@/lib/types";

type Tab = "guest" | "host";

function copyText(label: string, text: string) {
  void navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function statusLabel(s: Booking["status"]) {
  switch (s) {
    case "pending":
      return "Applied";
    case "confirmed":
      return "Confirmed";
    case "attended":
      return "Attended";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}

export function BookingsHub() {
  const user = useSessionStore((s) => s.user);
  const bookings = useSessionStore((s) => s.bookings);
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const cancelBooking = useSessionStore((s) => s.cancelBooking);
  const refundBooking = useSessionStore((s) => s.refundBooking);
  const updateHostedEvent = useSessionStore((s) => s.updateHostedEvent);
  const deleteHostedEvent = useSessionStore((s) => s.deleteHostedEvent);
  const approveBooking = useSessionStore((s) => s.approveBooking);
  const removeGuestBooking = useSessionStore((s) => s.removeGuestBooking);
  const markAttendance = useSessionStore((s) => s.markAttendance);

  const [tab, setTab] = useState<Tab>("guest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents),
    [hostedEvents],
  );

  const myHosting = useMemo(() => {
    if (!user) return [];
    return catalog.filter((e) => e.hostUserId === user.id);
  }, [catalog, user]);

  const myBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter((b) => b.userId === user.id);
  }, [bookings, user]);

  return (
    <div className="text-neutral-900">
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
        <button
          type="button"
          onClick={() => setTab("guest")}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-semibold transition",
            tab === "guest"
              ? "bg-neutral-900 text-white shadow-sm"
              : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
          )}
        >
          My bookings
        </button>
        <button
          type="button"
          onClick={() => setTab("host")}
          className={cn(
            "rounded-full px-5 py-2.5 text-sm font-semibold transition",
            tab === "host"
              ? "bg-neutral-900 text-white shadow-sm"
              : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50",
          )}
        >
          My hosting
        </button>
      </div>

      {tab === "guest" && (
        <ul className="mt-8 space-y-3">
          {myBookings.length === 0 && (
            <li className="text-sm text-neutral-900">No bookings yet.</li>
          )}
          {myBookings.map((b) => {
            const ev = getEventFromCatalog(b.eventId, hostedEvents);
            if (!ev) return null;
            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
            const shareUrl = `${origin}/event/${ev.id}?booking=${b.id}`;
            return (
              <li
                key={b.id}
                className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/event/${ev.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {ev.title}
                    </Link>
                    <p className="mt-1 text-xs text-neutral-800">
                      {statusLabel(b.status)} ·{" "}
                      {new Date(b.createdAt).toLocaleString()}
                      {b.refundedAt && " · Refunded (mock)"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
                      onClick={() => copyText("Share link", shareUrl)}
                    >
                      Share booking
                    </button>
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <>
                        <button
                          type="button"
                          className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
                          onClick={() => {
                            cancelBooking(b.id);
                            toast.success("Booking cancelled (mock).");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-500/10"
                          onClick={() => {
                            refundBooking(b.id);
                            toast.success("Refund recorded (mock).");
                          }}
                        >
                          Refund
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {(b.status === "confirmed" || b.status === "attended") &&
                  b.attendanceCode && (
                    <p className="mt-3 font-mono text-sm tracking-wider text-neutral-900">
                      Check-in code:{" "}
                      <span className="font-semibold">{b.attendanceCode}</span>
                      <span className="ml-2 text-xs font-sans text-neutral-800">
                        (show host at arrival)
                      </span>
                    </p>
                  )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === "host" && (
        <div className="mt-8 space-y-4">
          {myHosting.length === 0 && (
            <p className="text-sm text-neutral-900">
              You’re not hosting any meets yet —{" "}
              <Link href="/host-a-meet" className="font-semibold text-primary underline-offset-4 hover:underline">
                create one
              </Link>
              .
            </p>
          )}
          {myHosting.map((ev) => (
            <HostEventCard
              key={ev.id}
              event={ev}
              canEditMeet={hostedEvents.some((h) => h.id === ev.id)}
              expanded={expandedId === ev.id}
              onToggle={() =>
                setExpandedId((x) => (x === ev.id ? null : ev.id))
              }
              codeInputs={codeInputs}
              setCodeInputs={setCodeInputs}
              bookings={bookings}
              updateHostedEvent={updateHostedEvent}
              deleteHostedEvent={deleteHostedEvent}
              approveBooking={approveBooking}
              removeGuestBooking={removeGuestBooking}
              markAttendance={markAttendance}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HostEventCard({
  event: ev,
  canEditMeet,
  expanded,
  onToggle,
  codeInputs,
  setCodeInputs,
  bookings,
  updateHostedEvent,
  deleteHostedEvent,
  approveBooking,
  removeGuestBooking,
  markAttendance,
}: {
  event: MeetEvent;
  canEditMeet: boolean;
  expanded: boolean;
  onToggle: () => void;
  codeInputs: Record<string, string>;
  setCodeInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  bookings: Booking[];
  updateHostedEvent: (id: string, patch: Partial<MeetEvent>) => void;
  deleteHostedEvent: (id: string) => void;
  approveBooking: (id: string) => void;
  removeGuestBooking: (id: string) => void;
  markAttendance: (id: string, code: string) => boolean;
}) {
  const [hostFilter, setHostFilter] = useState<"all" | "pending" | "verified">(
    "all",
  );
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const hostShare = ev.shareToken
    ? `${origin}/event/${ev.id}?t=${ev.shareToken}`
    : `${origin}/event/${ev.id}`;

  const eventBookings = bookings.filter((b) => b.eventId === ev.id);

  const filtered = eventBookings.filter((b) => {
    if (hostFilter === "pending") return b.status === "pending";
    if (hostFilter === "verified") {
      const u = lookupUser(b.userId);
      return u?.verified === true;
    }
    return true;
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="font-medium text-neutral-900">{ev.title}</p>
          <p className="mt-1 text-xs text-neutral-800">
            {(ev.joinMode ?? "open") === "invite" ? "Invite" : "Open"} ·{" "}
            {(ev.listingVisibility ?? "public") === "public"
              ? "Public listing"
              : "Private link"}
            {" · "}
            {new Date(ev.startsAt).toLocaleString()}
          </p>
        </div>
        <span className="text-xs text-neutral-700">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-neutral-200 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
              onClick={() => copyText("Host share link", hostShare)}
            >
              Share meet link
            </button>
            {canEditMeet && (
              <button
                type="button"
                className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-500/10"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm("Delete this meet and its guest list (mock)?")
                  ) {
                    deleteHostedEvent(ev.id);
                    toast.success("Meet removed.");
                  }
                }}
              >
                Delete meet
              </button>
            )}
          </div>

          {!canEditMeet && (
            <p className="text-xs text-neutral-800">
              Demo seed meet — publish your own from Host a meet for full edit
              and delete controls.
            </p>
          )}

          {canEditMeet && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-neutral-900">
                  Listing
                  <select
                    className="liquid-glass-input mt-1 w-full text-sm"
                    value={ev.listingVisibility ?? "public"}
                    onChange={(e) =>
                      updateHostedEvent(ev.id, {
                        listingVisibility: e.target.value as
                          | "public"
                          | "private",
                      })
                    }
                  >
                    <option value="public">Public (Explore)</option>
                    <option value="private">Private (link only)</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-neutral-900">
                  Join policy
                  <select
                    className="liquid-glass-input mt-1 w-full text-sm"
                    value={ev.joinMode ?? "open"}
                    onChange={(e) =>
                      updateHostedEvent(ev.id, {
                        joinMode: e.target.value as "open" | "invite",
                      })
                    }
                  >
                    <option value="open">Open</option>
                    <option value="invite">Invite (approve)</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-neutral-900">
                  Title
                  <input
                    className="liquid-glass-input mt-1 w-full text-sm"
                    defaultValue={ev.title}
                    onBlur={(e) =>
                      updateHostedEvent(ev.id, { title: e.target.value })
                    }
                  />
                </label>
                <label className="text-xs font-medium text-neutral-900">
                  Capacity
                  <input
                    type="number"
                    min={4}
                    className="liquid-glass-input mt-1 w-full text-sm"
                    defaultValue={ev.capacity}
                    onBlur={(e) =>
                      updateHostedEvent(ev.id, {
                        capacity: Number(e.target.value) || ev.capacity,
                      })
                    }
                  />
                </label>
              </div>
            </>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Guests
            </p>
            <div className="mt-2 flex gap-2">
              {(["all", "pending", "verified"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHostFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    hostFilter === f
                      ? "bg-neutral-900 text-white"
                      : "border border-neutral-300 text-neutral-900 hover:bg-neutral-100",
                  )}
                >
                  {f === "all"
                    ? "All"
                    : f === "pending"
                      ? "Applied"
                      : "Verified"}
                </button>
              ))}
            </div>

            <ul className="mt-3 space-y-2">
              {filtered.length === 0 && (
                <li className="text-sm text-neutral-900">No guests in this view.</li>
              )}
              {filtered.map((b) => {
                const u = lookupUser(b.userId);
                const name =
                  u?.name ?? (b.userId.startsWith("u_") ? "Guest" : b.userId);
                return (
                  <li
                    key={b.id}
                    className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50/90 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {name}
                        {u?.verified && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            Verified
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-800">{statusLabel(b.status)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {b.status === "pending" && (
                        <>
                          <button
                            type="button"
                            className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white"
                            onClick={() => {
                              approveBooking(b.id);
                              toast.success("Guest approved.");
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-900"
                            onClick={() => {
                              removeGuestBooking(b.id);
                              toast.success("Request removed.");
                            }}
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <div className="flex items-center gap-1">
                          <input
                            placeholder="OTP"
                            className="liquid-glass-input w-24 py-1 text-xs"
                            value={codeInputs[b.id] ?? ""}
                            onChange={(e) =>
                              setCodeInputs((prev) => ({
                                ...prev,
                                [b.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="rounded-full border border-neutral-300 px-2 py-1 text-xs text-neutral-900"
                            onClick={() => {
                              const ok = markAttendance(
                                b.id,
                                codeInputs[b.id] ?? "",
                              );
                              if (ok) toast.success("Marked attended.");
                              else toast.error("Code does not match.");
                            }}
                          >
                            Mark
                          </button>
                        </div>
                      )}
                      {b.status === "confirmed" && (
                        <button
                          type="button"
                          className="text-xs text-red-700 hover:underline"
                          onClick={() => {
                            removeGuestBooking(b.id);
                            toast.success("Guest removed.");
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
