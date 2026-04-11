"use client";

import type { Booking, ChatMessage, MeetEvent, User } from "@/lib/types";
import {
  generateAttendanceCode,
  getEventFromCatalog,
} from "@/lib/eventsCatalog";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HostDraft = {
  title: string;
  description: string;
  cityId: string;
  category: string;
  startsAt: string;
  capacity: number;
  venueName: string;
  joinMode: "open" | "invite";
  listingVisibility: "public" | "private";
  priceCents: number;
};

type SessionState = {
  user: User | null;
  isAuthenticated: boolean;
  bookings: Booking[];
  hostedEvents: MeetEvent[];
  savedEventIds: string[];
  notificationsRead: Record<string, boolean>;
  hostDraft: HostDraft | null;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (partial: Partial<User>) => void;
  setVerified: (v: boolean) => void;
  addBooking: (b: Booking) => void;
  /** Join flow: creates pending or confirmed booking; returns false if duplicate / full. */
  tryJoinEvent: (event: MeetEvent) => { ok: boolean; booking?: Booking; reason?: string };
  toggleSaved: (eventId: string) => void;
  setHostDraft: (d: HostDraft | null) => void;
  publishHostedEvent: (event: MeetEvent) => void;
  updateHostedEvent: (id: string, patch: Partial<MeetEvent>) => void;
  deleteHostedEvent: (id: string) => void;
  removeGuestBooking: (bookingId: string) => void;
  approveBooking: (bookingId: string) => void;
  rejectBooking: (bookingId: string) => void;
  markAttendance: (bookingId: string, code: string) => boolean;
  cancelBooking: (bookingId: string) => void;
  refundBooking: (bookingId: string) => void;
  markNotificationRead: (id: string) => void;
  resetNotificationsRead: () => void;
  chatExtras: Record<string, ChatMessage[]>;
  appendChatMessage: (threadId: string, msg: ChatMessage) => void;
};

const initialHostDraft = (): HostDraft => ({
  title: "",
  description: "",
  cityId: "sf",
  category: "Social",
  startsAt: "",
  capacity: 16,
  venueName: "",
  joinMode: "open",
  listingVisibility: "public",
  priceCents: 0,
});

function bookingOccupiesSeat(b: Booking): boolean {
  return b.status === "confirmed" || b.status === "attended";
}

function countSeatsForEvent(eventId: string, bookings: Booking[]): number {
  return bookings.filter((b) => b.eventId === eventId && bookingOccupiesSeat(b))
    .length;
}

function isEventFull(event: MeetEvent, bookings: Booking[]): boolean {
  const taken = (event.spotsTaken ?? 0) + countSeatsForEvent(event.id, bookings);
  return taken >= event.capacity;
}

function makeBookingBase(
  userId: string,
  eventId: string,
  status: Booking["status"],
  withCode: boolean,
): Booking {
  const b: Booking = {
    id: "b_" + Math.random().toString(36).slice(2, 12),
    userId,
    eventId,
    status,
    createdAt: new Date().toISOString(),
  };
  if (withCode && (status === "confirmed" || status === "attended")) {
    b.attendanceCode = generateAttendanceCode();
  }
  return b;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      bookings: [],
      hostedEvents: [],
      savedEventIds: [],
      notificationsRead: {},
      hostDraft: null,
      chatExtras: {},
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          bookings: [],
          hostedEvents: [],
          savedEventIds: [],
          chatExtras: {},
        }),
      updateProfile: (partial) => {
        const u = get().user;
        if (!u) return;
        set({ user: { ...u, ...partial } });
      },
      setVerified: (v) => {
        const u = get().user;
        if (!u) return;
        set({ user: { ...u, verified: v } });
      },
      addBooking: (b) => set({ bookings: [...get().bookings, b] }),
      tryJoinEvent: (event) => {
        const user = get().user;
        if (!user) return { ok: false, reason: "Not signed in" };
        const bookings = get().bookings;
        if (bookings.some((b) => b.userId === user.id && b.eventId === event.id)) {
          return { ok: false, reason: "Already joined this meet" };
        }
        if (isEventFull(event, bookings)) {
          return { ok: false, reason: "This meet is full" };
        }
        const invite = (event.joinMode ?? "open") === "invite";
        const status = invite ? "pending" : "confirmed";
        const withCode = status === "confirmed";
        const b = makeBookingBase(user.id, event.id, status, withCode);
        set({ bookings: [...get().bookings, b] });
        return { ok: true, booking: b };
      },
      toggleSaved: (eventId) => {
        const s = new Set(get().savedEventIds);
        if (s.has(eventId)) s.delete(eventId);
        else s.add(eventId);
        set({ savedEventIds: [...s] });
      },
      setHostDraft: (d) => set({ hostDraft: d }),
      publishHostedEvent: (event) =>
        set({
          hostedEvents: [...get().hostedEvents, event],
          hostDraft: null,
        }),
      updateHostedEvent: (id, patch) =>
        set({
          hostedEvents: get().hostedEvents.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        }),
      deleteHostedEvent: (id) =>
        set({
          hostedEvents: get().hostedEvents.filter((e) => e.id !== id),
          bookings: get().bookings.filter((b) => b.eventId !== id),
        }),
      removeGuestBooking: (bookingId) =>
        set({
          bookings: get().bookings.filter((b) => b.id !== bookingId),
        }),
      approveBooking: (bookingId) => {
        const bookings = get().bookings;
        const b = bookings.find((x) => x.id === bookingId);
        if (!b || b.status !== "pending") return;
        const event = getEventFromCatalog(b.eventId, get().hostedEvents);
        if (!event) return;
        const others = bookings.filter((x) => x.id !== bookingId);
        if (isEventFull(event, others)) return;
        const code = generateAttendanceCode();
        set({
          bookings: bookings.map((x) =>
            x.id === bookingId
              ? {
                  ...x,
                  status: "confirmed" as const,
                  attendanceCode: code,
                }
              : x,
          ),
        });
      },
      rejectBooking: (bookingId) => {
        set({
          bookings: get().bookings.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  status: "cancelled" as const,
                  cancelledAt: new Date().toISOString(),
                }
              : b,
          ),
        });
      },
      markAttendance: (bookingId, code) => {
        const bookings = get().bookings;
        const b = bookings.find((x) => x.id === bookingId);
        if (!b || !b.attendanceCode || b.attendanceCode !== code.trim()) {
          return false;
        }
        if (b.status === "attended") return true;
        set({
          bookings: bookings.map((x) =>
            x.id === bookingId
              ? {
                  ...x,
                  status: "attended" as const,
                  attendedAt: new Date().toISOString(),
                }
              : x,
          ),
        });
        return true;
      },
      cancelBooking: (bookingId) => {
        set({
          bookings: get().bookings.map((b) =>
            b.id === bookingId &&
            (b.status === "pending" || b.status === "confirmed")
              ? {
                  ...b,
                  status: "cancelled" as const,
                  cancelledAt: new Date().toISOString(),
                }
              : b,
          ),
        });
      },
      refundBooking: (bookingId) => {
        set({
          bookings: get().bookings.map((b) =>
            b.id === bookingId && b.status !== "cancelled"
              ? {
                  ...b,
                  status: "cancelled" as const,
                  refundedAt: new Date().toISOString(),
                  cancelledAt: new Date().toISOString(),
                }
              : b,
          ),
        });
      },
      markNotificationRead: (id) =>
        set({
          notificationsRead: { ...get().notificationsRead, [id]: true },
        }),
      resetNotificationsRead: () => set({ notificationsRead: {} }),
      appendChatMessage: (threadId, msg) => {
        const prev = get().chatExtras[threadId] ?? [];
        set({
          chatExtras: {
            ...get().chatExtras,
            [threadId]: [...prev, msg],
          },
        });
      },
    }),
    { name: "connectsphere-session" },
  ),
);

export { initialHostDraft };
