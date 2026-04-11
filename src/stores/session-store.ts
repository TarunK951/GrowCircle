"use client";

import type { Booking, ChatMessage, MeetEvent, User } from "@/lib/types";
import {
  generateAttendanceCode,
  generateShareToken,
  getEventFromCatalog,
} from "@/lib/eventsCatalog";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HostDraft = {
  title: string;
  description: string;
  cityId: string;
  /** Max 3 preset category labels. */
  categories: string[];
  addressLine: string;
  startsAt: string;
  capacity: number;
  venueName: string;
  joinMode: "open" | "invite";
  listingVisibility: "public" | "private";
  priceCents: number;
  imageUrl: string;
  imageDataUrl: string | null;
  moreAbout: string;
  whatsIncludedLines: string[];
  guestSuggestions: string[];
  allowedAndNotes: string;
  houseDos: string[];
  houseDonts: string[];
  faqs: { q: string; a: string }[];
  /** Draft rows; ids assigned on publish. */
  preJoinQuestions: { prompt: string; options: string[] }[];
};

export type UiPrefs = {
  weeklyDigestEmail: boolean;
  showLiquidGlassHero: boolean;
  pushRemindersMock: boolean;
  eventRecommendationsMock: boolean;
  compactBookingCards: boolean;
  reduceMotionUi: boolean;
};

const defaultUiPrefs: UiPrefs = {
  weeklyDigestEmail: true,
  showLiquidGlassHero: true,
  pushRemindersMock: false,
  eventRecommendationsMock: true,
  compactBookingCards: false,
  reduceMotionUi: false,
};

type SessionState = {
  user: User | null;
  isAuthenticated: boolean;
  bookings: Booking[];
  hostedEvents: MeetEvent[];
  savedEventIds: string[];
  /** Local UI preferences (persisted). */
  uiPrefs: UiPrefs;
  setUiPrefs: (partial: Partial<UiPrefs>) => void;
  notificationsRead: Record<string, boolean>;
  hostDraft: HostDraft | null;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (partial: Partial<User>) => void;
  setVerified: (v: boolean) => void;
  addBooking: (b: Booking) => void;
  /** Join flow: creates pending or confirmed booking; returns false if duplicate / full. */
  tryJoinEvent: (
    event: MeetEvent,
    preJoinAnswers?: Record<string, string>,
  ) => { ok: boolean; booking?: Booking; reason?: string };
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
  /** One-time demo rows for Bookings / hosting UI testing (id prefix b_demo_). */
  seedDemoBookingData: () => void;
  /** Seed Saved with sample event ids when empty (demo). */
  seedDemoSavedIfEmpty: () => void;
};

const initialHostDraft = (): HostDraft => ({
  title: "",
  description: "",
  cityId: "sf",
  categories: ["Social"],
  addressLine: "",
  startsAt: "",
  capacity: 16,
  venueName: "",
  joinMode: "open",
  listingVisibility: "public",
  priceCents: 0,
  imageUrl: "",
  imageDataUrl: null,
  moreAbout: "",
  whatsIncludedLines: [""],
  guestSuggestions: [""],
  allowedAndNotes: "",
  houseDos: [""],
  houseDonts: [""],
  faqs: [{ q: "", a: "" }],
  preJoinQuestions: [],
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
  preJoinAnswers?: Record<string, string>,
): Booking {
  const b: Booking = {
    id: "b_" + Math.random().toString(36).slice(2, 12),
    userId,
    eventId,
    status,
    createdAt: new Date().toISOString(),
  };
  if (preJoinAnswers && Object.keys(preJoinAnswers).length > 0) {
    b.preJoinAnswers = { ...preJoinAnswers };
  }
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
      uiPrefs: { ...defaultUiPrefs },
      setUiPrefs: (partial) =>
        set((s) => ({
          uiPrefs: { ...s.uiPrefs, ...partial },
        })),
      notificationsRead: {},
      hostDraft: null,
      chatExtras: {},
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () =>
        set((s) => ({
          user: null,
          isAuthenticated: false,
          bookings: [],
          hostedEvents: [],
          savedEventIds: [],
          chatExtras: {},
          uiPrefs: s.uiPrefs,
        })),
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
      tryJoinEvent: (event, preJoinAnswers) => {
        const user = get().user;
        if (!user) return { ok: false, reason: "Not signed in" };
        const bookings = get().bookings;
        if (bookings.some((b) => b.userId === user.id && b.eventId === event.id)) {
          return { ok: false, reason: "Already joined this meet" };
        }
        if (isEventFull(event, bookings)) {
          return { ok: false, reason: "This meet is full" };
        }
        const qs = event.preJoinQuestions ?? [];
        if (qs.length > 0) {
          for (const q of qs) {
            const ans = preJoinAnswers?.[q.id]?.trim();
            if (!ans || !q.options.includes(ans)) {
              return {
                ok: false,
                reason: "Please answer all pre-join questions with valid choices.",
              };
            }
          }
        }
        const invite = (event.joinMode ?? "open") === "invite";
        const status = invite ? "pending" : "confirmed";
        const withCode = status === "confirmed";
        const answers =
          qs.length > 0 && preJoinAnswers ? { ...preJoinAnswers } : undefined;
        const b = makeBookingBase(
          user.id,
          event.id,
          status,
          withCode,
          answers,
        );
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
      seedDemoBookingData: () => {
        const user = get().user;
        if (!user) return;
        if (get().bookings.some((b) => b.id === "b_demo_evt1")) return;

        const demoEventId = "evt_demo_u_host";
        const startsAt = new Date(Date.now() + 10 * 864e5).toISOString();
        const demoHosted: MeetEvent = {
          id: demoEventId,
          title: "Coffee & sketch — demo hosting",
          description:
            "Sunday morning doodling. Sample row for testing host tools.",
          cityId: "sf",
          startsAt,
          hostUserId: user.id,
          capacity: 12,
          category: "Culture",
          image:
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop&q=80",
          priceCents: 500,
          venueName: "Demo Café",
          joinMode: "invite",
          listingVisibility: "public",
          shareToken: generateShareToken(),
          spotsTaken: 0,
        };

        const now = new Date().toISOString();
        const extra: Booking[] = [];

        if (
          !get().bookings.some(
            (b) => b.userId === user.id && b.eventId === "evt_1",
          )
        ) {
          extra.push({
            id: "b_demo_evt1",
            userId: user.id,
            eventId: "evt_1",
            status: "confirmed",
            createdAt: now,
            attendanceCode: "482916",
          });
        }
        if (
          !get().bookings.some(
            (b) => b.userId === user.id && b.eventId === "evt_2",
          )
        ) {
          extra.push({
            id: "b_demo_evt2",
            userId: user.id,
            eventId: "evt_2",
            status: "pending",
            createdAt: now,
          });
        }
        extra.push({
          id: "b_demo_host_pending",
          userId: "u_host_2",
          eventId: demoEventId,
          status: "pending",
          createdAt: now,
        });

        const hosted = get().hostedEvents.some((e) => e.id === demoEventId)
          ? get().hostedEvents
          : [...get().hostedEvents, demoHosted];

        set({
          hostedEvents: hosted,
          bookings: [...get().bookings, ...extra],
        });
      },
      seedDemoSavedIfEmpty: () => {
        if (get().savedEventIds.length > 0) return;
        set({
          savedEventIds: ["evt_1", "evt_2", "evt_3"],
        });
      },
    }),
    {
      name: "connectsphere-session",
      merge: (persisted, current) => {
        const p = persisted as Partial<SessionState> | undefined;
        return {
          ...current,
          ...p,
          uiPrefs: { ...defaultUiPrefs, ...p?.uiPrefs },
        };
      },
    },
  ),
);

export { initialHostDraft };
