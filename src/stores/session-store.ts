"use client";

import type { Booking, ChatMessage, User } from "@/lib/types";
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
};

type SessionState = {
  user: User | null;
  isAuthenticated: boolean;
  bookings: Booking[];
  savedEventIds: string[];
  notificationsRead: Record<string, boolean>;
  hostDraft: HostDraft | null;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (partial: Partial<User>) => void;
  setVerified: (v: boolean) => void;
  addBooking: (b: Booking) => void;
  toggleSaved: (eventId: string) => void;
  setHostDraft: (d: HostDraft | null) => void;
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
});

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      bookings: [],
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
      toggleSaved: (eventId) => {
        const s = new Set(get().savedEventIds);
        if (s.has(eventId)) s.delete(eventId);
        else s.add(eventId);
        set({ savedEventIds: [...s] });
      },
      setHostDraft: (d) => set({ hostDraft: d }),
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
