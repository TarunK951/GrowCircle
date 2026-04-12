"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/circle/notificationsApi";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { selectAccessToken } from "@/lib/store/authSlice";
import { circleApi, useNotificationsQuery } from "@/lib/store/circleApi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import type { CircleApiNotification } from "@/lib/circle/types";
import { useState } from "react";

const PAGE_SIZE = 20;

function notifyUnreadRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("circle-unread-refresh"));
  }
}

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const useApi = Boolean(accessToken) && isCircleApiConfigured();

  const [page, setPage] = useState(1);
  const [markAllBusy, setMarkAllBusy] = useState(false);

  const { data: notifResult, isLoading: loading, refetch } = useNotificationsQuery(
    { page, limit: PAGE_SIZE },
    { skip: !useApi },
  );

  const items = notifResult?.data ?? [];
  const meta = notifResult?.meta ?? {
    total: 0,
    page,
    limit: PAGE_SIZE,
    totalPages: 0,
  };

  const invalidateUnread = () => {
    dispatch(
      circleApi.util.invalidateTags([{ type: "UnreadCount", id: "COUNT" }]),
    );
    notifyUnreadRefresh();
  };

  const onMarkOne = async (n: CircleApiNotification) => {
    if (!accessToken || n.is_read) return;
    try {
      await markNotificationRead(accessToken, n.id);
      await refetch();
      invalidateUnread();
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not update",
      );
    }
  };

  const onMarkAll = async () => {
    if (!accessToken) return;
    setMarkAllBusy(true);
    try {
      await markAllNotificationsRead(accessToken);
      await refetch();
      invalidateUnread();
      toast.success("All notifications marked as read.");
    } catch (e) {
      toast.error(
        e instanceof CircleApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not update",
      );
    } finally {
      setMarkAllBusy(false);
    }
  };

  if (!isCircleApiConfigured()) {
    return (
      <div className="mx-auto max-w-2xl text-neutral-900">
        <h1 className="font-onest text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Notifications
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-900">
          Set{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs">
            NEXT_PUBLIC_CIRCLE_API_BASE
          </code>{" "}
          to load notifications from the Circle backend.
        </p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-2xl text-neutral-900">
        <h1 className="font-onest text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Notifications
        </h1>
        <p className="mt-2 text-sm font-medium text-neutral-900">
          Sign in with your phone to see notifications.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-semibold text-violet-800 underline"
        >
          Log in
        </Link>
      </div>
    );
  }

  const totalPages = Math.max(1, meta.totalPages || 1);

  return (
    <div className="mx-auto max-w-2xl text-neutral-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-onest text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-2 text-sm font-medium text-neutral-900">
            Updates from Circle — mark as read or open a linked event.
          </p>
        </div>
        <button
          type="button"
          disabled={markAllBusy || items.every((x) => x.is_read)}
          className="shrink-0 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
          onClick={() => void onMarkAll()}
        >
          {markAllBusy ? "Working…" : "Mark all read"}
        </button>
      </div>

      {loading && <p className="mt-8 text-sm text-neutral-900">Loading…</p>}

      {!loading && items.length === 0 && (
        <p className="mt-8 text-sm text-neutral-900">No notifications yet.</p>
      )}

      <ul className="mt-8 space-y-3">
        {items.map((n) => {
          const eventId =
            n.metadata &&
            typeof n.metadata === "object" &&
            "eventId" in n.metadata &&
            typeof (n.metadata as { eventId?: unknown }).eventId === "string"
              ? (n.metadata as { eventId: string }).eventId
              : null;

          return (
            <li
              key={n.id}
              className={`rounded-xl border border-neutral-200 px-4 py-3 transition ${
                n.is_read ? "bg-white" : "bg-neutral-50"
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => void onMarkOne(n)}
              >
                <p className="font-semibold text-neutral-900">{n.title}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-900">
                  {n.message}
                </p>
                <p className="mt-2 text-xs font-medium text-neutral-900">
                  {n.type} · {new Date(n.created_at).toLocaleString()}
                </p>
              </button>
              {eventId && (
                <Link
                  href={`/event/${eventId}`}
                  className="mt-2 inline-block text-xs font-semibold text-violet-800 underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View event
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {meta.totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-full border border-neutral-300 px-4 py-2 font-semibold disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-neutral-900">
            Page {meta.page} of {totalPages} ({meta.total} total)
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            className="rounded-full border border-neutral-300 px-4 py-2 font-semibold disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
