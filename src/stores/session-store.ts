"use client";

import type {
  AttendeeMeetReview,
  Booking,
  ChatMessage,
  GuestReviewWritten,
  HostReviewReceived,
  MeetEvent,
  User,
} from "@/lib/types";
import { mergeHostedEventPreservingLocalCover } from "@/lib/events/mergeHostedFromApi";
import {
  generateAttendanceCode,
  getEventFromCatalog,
} from "@/lib/eventsCatalog";
import { emptySocialConnections } from "@/lib/socialLinks";
import { clearAuthState, setCircleAuth, setLocalUser, updateUser } from "@/lib/store/authSlice";
import { circleApi } from "@/lib/store/circleApi";
import { store } from "@/lib/store/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ZUSTAND_SESSION_KEY } from "@/lib/persistKeys";

function authUser() {
  return store.getState().auth.user;
}

/** One cover slot: file preview (`dataUrl`) and/or HTTPS URL. Up to 3 slots total. */
export type HostCoverSlot = {
  dataUrl: string | null;
  url: string;
};

export type HostDraft = {
  title: string;
  description: string;
  /** API `more_about` — longer story; `description` stays the short listing blurb. */
  moreAbout: string;
  /** API `whats_included` — one line per bullet. */
  whatsIncluded: string[];
  /** API `guest_suggestions`. */
  guestSuggestions: string[];
  /** API `allowed_and_notes` — what to bring, accessibility, etc. */
  allowedAndNotes: string;
  /** API `house_rules.dos` */
  houseDos: string[];
  /** API `house_rules.donts` */
  houseDonts: string[];
  /** API `event_rules` — overall written rules (optional). */
  eventRules: string;
  /** API `location_type` — slug from `HOST_LOCATION_TYPE_OPTIONS`. */
  locationType: string;
  cityId: string;
  /** Up to 3 preset labels → API `category` (first) + `tags` (rest + `tagsComma`). */
  categories: string[];
  /** Optional comma-separated extra tags for the API `tags` field. */
  tagsComma: string;
  /** IANA tz (e.g. Asia/Kolkata) sent as `timezone` on create/update. */
  timezone: string;
  addressLine: string;
  startsAt: string;
  capacity: number;
  venueName: string;
  /** Maps to Circle `waitlist_enabled`. */
  waitlistEnabled: boolean;
  listingVisibility: "public" | "private";
  priceCents: number;
  /** Up to 3 images; first is used as Circle `cover_image_url`. */
  coverSlots: HostCoverSlot[];
  faqs: { q: string; a: string }[];
  /** Draft rows; ids assigned on publish. */
  preJoinQuestions: { prompt: string; options: string[] }[];
  /** API `min_age`; `null` = all ages. */
  minAge: number | null;
  /** Maps to API `min_verification_tier` (0 or 1). */
  requireVerifiedGuests: boolean;
  /** API `terms_required`. */
  termsRequired: boolean;
  /** API `refund_policy`. */
  refundPolicy: string;
  refundFullBeforeHours: number;
  refundPartialBeforeHours: number;
  refundPartialPercentage: number;
  contactEmail: string;
  contactPhone: string;
  /** Local `datetime-local` values; API `registration_opens_at` / `registration_closes_at`. */
  registrationOpensAt: string;
  registrationClosesAt: string;
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
  bookings: Booking[];
  hostedEvents: MeetEvent[];
  savedEventIds: string[];
  /** Local UI preferences (persisted). */
  uiPrefs: UiPrefs;
  setUiPrefs: (partial: Partial<UiPrefs>) => void;
  /** Mock OAuth-style flags per platform id (see `SOCIAL_PLATFORMS`). */
  socialConnections: Record<string, boolean>;
  setSocialConnection: (platformId: string, linked: boolean) => void;
  toggleSocialConnection: (platformId: string) => void;
  notificationsRead: Record<string, boolean>;
  hostDraft: HostDraft | null;
  /** Persisted wizard step index (0-based). */
  hostWizardStep: number;
  setHostWizardStep: (n: number) => void;
  /** Public events fetched from Circle API (merged into explore / detail). */
  circleCatalogEvents: MeetEvent[];
  setCircleCatalogEvents: (events: MeetEvent[]) => void;
  upsertCircleCatalogEvent: (event: MeetEvent) => void;
  login: (user: User) => void;
  loginWithCircle: (
    user: User,
    tokens: { accessToken: string; refreshToken: string },
  ) => void;
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
  /** Remove multiple bookmark ids (e.g. past meets pruned from Saved). */
  removeSavedEventIds: (ids: string[]) => void;
  setHostDraft: (d: HostDraft | null) => void;
  publishHostedEvent: (event: MeetEvent) => void;
  /** Replace or insert rows returned from `GET /events/my` (same ids win from API). */
  syncHostedEventsFromApi: (apiRows: MeetEvent[]) => void;
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
  /** Local-only: hidden message threads (e.g. blocked). */
  blockedMessageThreadIds: string[];
  blockMessageThread: (threadId: string) => void;
  unblockMessageThread: (threadId: string) => void;
  /** Reviews you posted about guests (as host). */
  guestReviewsWritten: GuestReviewWritten[];
  /** Reviews from guests about you (as host). */
  hostReviewsReceived: HostReviewReceived[];
  /** Reviews you posted about a meet (as guest — tied to an attended booking). */
  attendeeMeetReviews: AttendeeMeetReview[];
  addGuestReviewWritten: (r: Omit<GuestReviewWritten, "id" | "createdAt">) => void;
  addAttendeeMeetReview: (
    r: Omit<AttendeeMeetReview, "id" | "createdAt">,
  ) => { ok: true } | { ok: false; reason: "duplicate" | "invalid" };
};

const initialHostDraft = (): HostDraft => ({
  title: "",
  description: "",
  moreAbout: "",
  whatsIncluded: [""],
  guestSuggestions: [""],
  allowedAndNotes: "",
  houseDos: [""],
  houseDonts: [""],
  eventRules: "",
  locationType: "",
  cityId: "blr",
  categories: ["Social"],
  tagsComma: "",
  timezone: "Asia/Kolkata",
  addressLine: "",
  startsAt: "",
  capacity: 16,
  venueName: "",
  waitlistEnabled: true,
  listingVisibility: "public",
  priceCents: 0,
  coverSlots: [{ dataUrl: null, url: "" }],
  faqs: [{ q: "", a: "" }],
  preJoinQuestions: [],
  minAge: null,
  requireVerifiedGuests: false,
  termsRequired: false,
  refundPolicy: "",
  refundFullBeforeHours: 48,
  refundPartialBeforeHours: 24,
  refundPartialPercentage: 50,
  contactEmail: "",
  contactPhone: "",
  registrationOpensAt: "",
  registrationClosesAt: "",
});

/** Merge persisted or partial JSON into a full `HostDraft` (legacy single-image fields → slot 0). */
export function normalizeHostDraft(raw: unknown): HostDraft {
  const base = initialHostDraft();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  let coverSlots = base.coverSlots;
  if (Array.isArray(o.coverSlots)) {
    coverSlots = (o.coverSlots as HostCoverSlot[])
      .slice(0, 3)
      .map((s) => ({
        dataUrl: typeof s?.dataUrl === "string" ? s.dataUrl : null,
        url: typeof s?.url === "string" ? s.url : "",
      }));
    if (coverSlots.length === 0) coverSlots = [{ dataUrl: null, url: "" }];
  } else {
    const legacyUrl = typeof o.imageUrl === "string" ? o.imageUrl : "";
    const legacyData =
      typeof o.imageDataUrl === "string" ? o.imageDataUrl : null;
    if (legacyUrl || legacyData) {
      coverSlots = [{ dataUrl: legacyData, url: legacyUrl }];
    }
  }

  const legacyJoinInvite = o.joinMode === "invite";
  const strList = (v: unknown, fallback: string[]): string[] => {
    if (!Array.isArray(v)) return fallback;
    const xs = v
      .filter((x): x is string => typeof x === "string")
      .map((s) => s);
    return xs.length > 0 ? xs : fallback;
  };

  const next: HostDraft = {
    ...base,
    title: typeof o.title === "string" ? o.title : base.title,
    description: typeof o.description === "string" ? o.description : base.description,
    moreAbout: typeof o.moreAbout === "string" ? o.moreAbout : base.moreAbout,
    whatsIncluded: strList(o.whatsIncluded, base.whatsIncluded),
    guestSuggestions: strList(o.guestSuggestions, base.guestSuggestions),
    allowedAndNotes:
      typeof o.allowedAndNotes === "string"
        ? o.allowedAndNotes
        : base.allowedAndNotes,
    houseDos: strList(o.houseDos, base.houseDos),
    houseDonts: strList(o.houseDonts, base.houseDonts),
    eventRules:
      typeof o.eventRules === "string" ? o.eventRules : base.eventRules,
    locationType:
      typeof o.locationType === "string" ? o.locationType : base.locationType,
    cityId: typeof o.cityId === "string" ? o.cityId : base.cityId,
    categories: Array.isArray(o.categories)
      ? (o.categories as string[]).filter((c) => typeof c === "string")
      : base.categories,
    tagsComma: typeof o.tagsComma === "string" ? o.tagsComma : base.tagsComma,
    timezone: typeof o.timezone === "string" && o.timezone.trim() ? o.timezone : base.timezone,
    addressLine: typeof o.addressLine === "string" ? o.addressLine : base.addressLine,
    startsAt: typeof o.startsAt === "string" ? o.startsAt : base.startsAt,
    capacity:
      typeof o.capacity === "number" && Number.isFinite(o.capacity)
        ? o.capacity
        : base.capacity,
    venueName: typeof o.venueName === "string" ? o.venueName : base.venueName,
    waitlistEnabled:
      typeof o.waitlistEnabled === "boolean"
        ? o.waitlistEnabled
        : legacyJoinInvite
          ? true
          : base.waitlistEnabled,
    listingVisibility: o.listingVisibility === "private" ? "private" : "public",
    priceCents:
      typeof o.priceCents === "number" && Number.isFinite(o.priceCents)
        ? Math.max(0, o.priceCents)
        : base.priceCents,
    coverSlots,
    faqs: Array.isArray(o.faqs)
      ? (o.faqs as { q: string; a: string }[])
          .filter((f) => f && typeof f === "object")
          .map((f) => ({
            q: typeof f.q === "string" ? f.q : "",
            a: typeof f.a === "string" ? f.a : "",
          }))
      : base.faqs,
    preJoinQuestions: Array.isArray(o.preJoinQuestions)
      ? (o.preJoinQuestions as { prompt: string; options: string[] }[])
          .filter((r) => r && typeof r === "object")
          .map((r) => ({
            prompt: typeof r.prompt === "string" ? r.prompt : "",
            options: Array.isArray(r.options)
              ? r.options.map((x) => (typeof x === "string" ? x : ""))
              : [""],
          }))
      : base.preJoinQuestions,
    minAge:
      o.minAge === null
        ? null
        : typeof o.minAge === "number" && Number.isFinite(o.minAge)
          ? o.minAge
          : base.minAge,
    requireVerifiedGuests:
      typeof o.requireVerifiedGuests === "boolean"
        ? o.requireVerifiedGuests
        : base.requireVerifiedGuests,
    termsRequired:
      typeof o.termsRequired === "boolean"
        ? o.termsRequired
        : base.termsRequired,
    refundPolicy:
      typeof o.refundPolicy === "string" ? o.refundPolicy : base.refundPolicy,
    refundFullBeforeHours:
      typeof o.refundFullBeforeHours === "number" &&
      Number.isFinite(o.refundFullBeforeHours)
        ? Math.max(0, Math.floor(o.refundFullBeforeHours))
        : base.refundFullBeforeHours,
    refundPartialBeforeHours:
      typeof o.refundPartialBeforeHours === "number" &&
      Number.isFinite(o.refundPartialBeforeHours)
        ? Math.max(0, Math.floor(o.refundPartialBeforeHours))
        : base.refundPartialBeforeHours,
    refundPartialPercentage:
      typeof o.refundPartialPercentage === "number" &&
      Number.isFinite(o.refundPartialPercentage)
        ? Math.min(100, Math.max(0, Math.round(o.refundPartialPercentage)))
        : base.refundPartialPercentage,
    contactEmail:
      typeof o.contactEmail === "string" ? o.contactEmail : base.contactEmail,
    contactPhone:
      typeof o.contactPhone === "string" ? o.contactPhone : base.contactPhone,
    registrationOpensAt:
      typeof o.registrationOpensAt === "string"
        ? o.registrationOpensAt
        : base.registrationOpensAt,
    registrationClosesAt:
      typeof o.registrationClosesAt === "string"
        ? o.registrationClosesAt
        : base.registrationClosesAt,
  };
  return next;
}

function stripDraftForPersist(d: HostDraft | null): HostDraft | null {
  if (!d) return null;
  return {
    ...d,
    coverSlots: d.coverSlots.map((s) => ({
      dataUrl: null,
      url: s.url,
    })),
  };
}

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
      bookings: [],
      hostedEvents: [],
      savedEventIds: [],
      uiPrefs: { ...defaultUiPrefs },
      setUiPrefs: (partial) =>
        set((s) => ({
          uiPrefs: { ...s.uiPrefs, ...partial },
        })),
      socialConnections: emptySocialConnections(),
      setSocialConnection: (platformId, linked) =>
        set((s) => ({
          socialConnections: {
            ...s.socialConnections,
            [platformId]: linked,
          },
        })),
      toggleSocialConnection: (platformId) =>
        set((s) => ({
          socialConnections: {
            ...s.socialConnections,
            [platformId]: !s.socialConnections[platformId],
          },
        })),
      notificationsRead: {},
      hostDraft: null,
      hostWizardStep: 0,
      setHostWizardStep: (n) =>
        set({ hostWizardStep: Math.max(0, Math.min(9, Math.floor(n))) }),
      chatExtras: {},
      blockedMessageThreadIds: [],
      circleCatalogEvents: [],
      setCircleCatalogEvents: (events) => set({ circleCatalogEvents: events }),
      upsertCircleCatalogEvent: (event) =>
        set((s) => {
          const rest = s.circleCatalogEvents.filter((e) => e.id !== event.id);
          return { circleCatalogEvents: [...rest, event] };
        }),
      login: (user) => {
        store.dispatch(setLocalUser(user));
      },
      loginWithCircle: (user, tokens) => {
        store.dispatch(
          setCircleAuth({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }),
        );
      },
      logout: () => {
        store.dispatch(clearAuthState());
        store.dispatch(circleApi.util.resetApiState());
        set((s) => ({
          bookings: [],
          hostedEvents: [],
          savedEventIds: [],
          chatExtras: {},
          blockedMessageThreadIds: [],
          uiPrefs: s.uiPrefs,
          socialConnections: s.socialConnections,
          guestReviewsWritten: [],
          hostReviewsReceived: [],
          attendeeMeetReviews: [],
        }));
      },
      updateProfile: (partial) => {
        if (!authUser()) return;
        store.dispatch(updateUser(partial));
      },
      setVerified: (v) => {
        if (!authUser()) return;
        store.dispatch(updateUser({ verified: v }));
      },
      addBooking: (b) => set({ bookings: [...get().bookings, b] }),
      tryJoinEvent: (event, preJoinAnswers) => {
        const user = authUser();
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
            const raw = preJoinAnswers?.[q.id];
            if (q.allowMultiple) {
              try {
                const arr = JSON.parse(raw || "[]") as unknown;
                if (!Array.isArray(arr) || arr.length === 0) {
                  return {
                    ok: false,
                    reason:
                      "Please answer all pre-join questions with valid choices.",
                  };
                }
                for (const x of arr) {
                  if (
                    typeof x !== "string" ||
                    !q.options.includes(x)
                  ) {
                    return {
                      ok: false,
                      reason:
                        "Please answer all pre-join questions with valid choices.",
                    };
                  }
                }
              } catch {
                return {
                  ok: false,
                  reason:
                    "Please answer all pre-join questions with valid choices.",
                };
              }
            } else {
              const ans = raw?.trim();
              if (!ans || !q.options.includes(ans)) {
                return {
                  ok: false,
                  reason:
                    "Please answer all pre-join questions with valid choices.",
                };
              }
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
      removeSavedEventIds: (ids) => {
        if (ids.length === 0) return;
        const remove = new Set(ids);
        set({
          savedEventIds: get().savedEventIds.filter((id) => !remove.has(id)),
        });
      },
      setHostDraft: (d) => set({ hostDraft: d }),
      publishHostedEvent: (event) =>
        set({
          hostedEvents: [...get().hostedEvents, event],
          hostDraft: null,
          hostWizardStep: 0,
        }),
      syncHostedEventsFromApi: (apiRows) =>
        set((s) => {
          const prevById = new Map(s.hostedEvents.map((e) => [e.id, e]));
          const apiIds = new Set(apiRows.map((e) => e.id));
          const merged = apiRows.map((row) =>
            mergeHostedEventPreservingLocalCover(prevById.get(row.id), row),
          );
          const keepLocal = s.hostedEvents.filter((e) => !apiIds.has(e.id));
          return { hostedEvents: [...keepLocal, ...merged] };
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
        const event = getEventFromCatalog(
          b.eventId,
          get().hostedEvents,
          get().circleCatalogEvents,
        );
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
      blockMessageThread: (threadId) =>
        set((s) => ({
          blockedMessageThreadIds: s.blockedMessageThreadIds.includes(threadId)
            ? s.blockedMessageThreadIds
            : [...s.blockedMessageThreadIds, threadId],
        })),
      unblockMessageThread: (threadId) =>
        set((s) => ({
          blockedMessageThreadIds: s.blockedMessageThreadIds.filter(
            (id) => id !== threadId,
          ),
        })),
      guestReviewsWritten: [],
      hostReviewsReceived: [],
      attendeeMeetReviews: [],
      addGuestReviewWritten: (r) => {
        const row: GuestReviewWritten = {
          ...r,
          id: `gr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
        set({ guestReviewsWritten: [row, ...get().guestReviewsWritten] });
      },
      addAttendeeMeetReview: (r) => {
        const state = get();
        const u = authUser();
        if (
          state.attendeeMeetReviews.some((x) => x.bookingId === r.bookingId)
        ) {
          return { ok: false, reason: "duplicate" };
        }
        const booking = state.bookings.find((b) => b.id === r.bookingId);
        if (
          !booking ||
          !u ||
          booking.userId !== u.id ||
          booking.status !== "attended"
        ) {
          return { ok: false, reason: "invalid" };
        }
        const row: AttendeeMeetReview = {
          ...r,
          id: `amr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
        set({
          attendeeMeetReviews: [row, ...get().attendeeMeetReviews],
        });
        return { ok: true };
      },
    }),
    {
      name: ZUSTAND_SESSION_KEY,
      partialize: (state) => ({
        bookings: state.bookings,
        hostedEvents: state.hostedEvents,
        savedEventIds: state.savedEventIds,
        uiPrefs: state.uiPrefs,
        socialConnections: state.socialConnections,
        notificationsRead: state.notificationsRead,
        hostDraft: stripDraftForPersist(state.hostDraft),
        hostWizardStep: state.hostWizardStep,
        chatExtras: state.chatExtras,
        blockedMessageThreadIds: state.blockedMessageThreadIds,
        circleCatalogEvents: state.circleCatalogEvents,
        guestReviewsWritten: state.guestReviewsWritten,
        hostReviewsReceived: state.hostReviewsReceived,
        attendeeMeetReviews: state.attendeeMeetReviews,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<SessionState> | undefined;
        return {
          ...current,
          ...p,
          uiPrefs: { ...defaultUiPrefs, ...p?.uiPrefs },
          socialConnections: {
            ...emptySocialConnections(),
            ...p?.socialConnections,
          },
          hostDraft:
            p?.hostDraft === undefined
              ? current.hostDraft
              : p.hostDraft === null
                ? null
                : normalizeHostDraft(p.hostDraft),
          hostWizardStep: p?.hostWizardStep ?? current.hostWizardStep,
          circleCatalogEvents: p?.circleCatalogEvents ?? current.circleCatalogEvents,
          guestReviewsWritten: p?.guestReviewsWritten ?? current.guestReviewsWritten,
          hostReviewsReceived: p?.hostReviewsReceived ?? current.hostReviewsReceived,
          attendeeMeetReviews:
            p?.attendeeMeetReviews ?? current.attendeeMeetReviews,
          blockedMessageThreadIds:
            p?.blockedMessageThreadIds ?? current.blockedMessageThreadIds,
        };
      },
    },
  ),
);

export { initialHostDraft };
