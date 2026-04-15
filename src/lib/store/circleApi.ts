import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  getMyHostedEvents,
  listAdvancedEvents,
  listPublicEvents,
} from "@/lib/circle/api";
import { getMyApplications } from "@/lib/circle/applicationsApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { circleEventToMeetEvent } from "@/lib/circle/mappers";
import {
  getUnreadNotificationCount,
  listNotifications,
} from "@/lib/circle/notificationsApi";
import type { MeetEvent } from "@/lib/types";
import type {
  CircleApiNotification,
  CircleListMeta,
  CircleMyApplication,
} from "@/lib/circle/types";
import type { AuthState } from "./authSlice";

type AuthSliceRoot = { auth: AuthState };

function err(e: unknown): { error: { status: "CUSTOM_ERROR"; error: string } } {
  const msg =
    e instanceof CircleApiError
      ? e.message
      : e instanceof Error
        ? e.message
        : String(e);
  return { error: { status: "CUSTOM_ERROR", error: msg } };
}

export const circleApi = createApi({
  reducerPath: "circleApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    "PublicEvents",
    "HostedEvents",
    "MyApplications",
    "Notifications",
    "UnreadCount",
  ],
  endpoints: (builder) => ({
    listPublicEvents: builder.query<
      MeetEvent[],
      { page?: number; limit?: number } | void
    >({
      async queryFn(arg) {
        if (!isCircleApiConfigured()) {
          return { data: [] };
        }
        const page = arg?.page ?? 1;
        const limit = arg?.limit ?? 100;
        try {
          const { data } = await listPublicEvents({
            status: "published",
            page,
            limit,
          });
          return { data: data.map((row) => circleEventToMeetEvent(row)) };
        } catch (e) {
          try {
            const { data } = await listAdvancedEvents({ page, limit });
            return {
              data: data.map((row) => circleEventToMeetEvent(row)),
            };
          } catch {
            return err(e);
          }
        }
      },
      providesTags: [{ type: "PublicEvents", id: "LIST" }],
    }),

    hostedEvents: builder.query<MeetEvent[], void>({
      async queryFn(_arg, { getState }) {
        if (!isCircleApiConfigured()) {
          return { data: [] };
        }
        const { ensureCircleAccessToken } = await import(
          "@/lib/circle/sessionBridge"
        );
        const token = await ensureCircleAccessToken();
        const state = getState() as AuthSliceRoot;
        const defaultHostUserId = state.auth.user?.id;
        if (!token) {
          return { data: [] };
        }
        try {
          const rows = await getMyHostedEvents(token);
          return {
            data: rows.map((row) =>
              circleEventToMeetEvent(row, { defaultHostUserId }),
            ),
          };
        } catch (e) {
          return err(e);
        }
      },
      providesTags: [{ type: "HostedEvents", id: "LIST" }],
    }),

    myApplications: builder.query<CircleMyApplication[], void>({
      async queryFn(_arg) {
        if (!isCircleApiConfigured()) {
          return { data: [] };
        }
        const { ensureCircleAccessToken } = await import(
          "@/lib/circle/sessionBridge"
        );
        const token = await ensureCircleAccessToken();
        if (!token) {
          return { data: [] };
        }
        try {
          const data = await getMyApplications(token);
          return { data: Array.isArray(data) ? data : [] };
        } catch (e) {
          return err(e);
        }
      },
      providesTags: [{ type: "MyApplications", id: "LIST" }],
    }),

    notifications: builder.query<
      { data: CircleApiNotification[]; meta: CircleListMeta },
      { page: number; limit: number }
    >({
      async queryFn(arg) {
        if (!isCircleApiConfigured()) {
          return {
            data: {
              data: [],
              meta: {
                total: 0,
                page: arg.page,
                limit: arg.limit,
                totalPages: 0,
              },
            },
          };
        }
        const { ensureCircleAccessToken } = await import(
          "@/lib/circle/sessionBridge"
        );
        const token = await ensureCircleAccessToken();
        if (!token) {
          return {
            data: {
              data: [],
              meta: {
                total: 0,
                page: arg.page,
                limit: arg.limit,
                totalPages: 0,
              },
            },
          };
        }
        try {
          const res = await listNotifications(token, {
            page: arg.page,
            limit: arg.limit,
          });
          return { data: res };
        } catch (e) {
          return err(e);
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((n) => ({
                type: "Notifications" as const,
                id: n.id,
              })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),

    unreadNotificationCount: builder.query<number, void>({
      async queryFn(_arg) {
        if (!isCircleApiConfigured()) {
          return { data: 0 };
        }
        const { ensureCircleAccessToken } = await import(
          "@/lib/circle/sessionBridge"
        );
        const token = await ensureCircleAccessToken();
        if (!token) {
          return { data: 0 };
        }
        try {
          const res = await getUnreadNotificationCount(token);
          return { data: res.count ?? 0 };
        } catch {
          return { data: 0 };
        }
      },
      providesTags: [{ type: "UnreadCount", id: "COUNT" }],
    }),
  }),
});

export const {
  useListPublicEventsQuery,
  useHostedEventsQuery,
  useMyApplicationsQuery,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} = circleApi;
