import { CircleApiError, circleRequest, circleRequestBlob } from "@/lib/circle/client";
import { getCircleApiBase } from "@/lib/circle/config";
import type {
  CircleAuthUser,
  CircleBroadcastBody,
  CircleEvent,
  CircleEventQuestion,
  CircleEventQuestionInput,
  CircleListMeta,
  CircleProfile,
  VerifyOtpData,
} from "@/lib/circle/types";

/** §1.1 */
export function sendOtp(phone: string) {
  return circleRequest<unknown>("/auth/send-otp", { body: { phone } });
}

/** §1.2 */
export function verifyOtp(phone: string, otp: string) {
  return circleRequest<VerifyOtpData>("/auth/verify-otp", {
    body: { phone, otp },
  });
}

/** §1.3 */
export function completeProfile(
  accessToken: string,
  body: { username: string; email: string; dob: string },
) {
  return circleRequest<CircleProfile>("/auth/complete-profile", {
    accessToken,
    body,
  });
}

/** §1.4 */
export function refreshTokens(refreshToken: string) {
  return circleRequest<{ accessToken: string; refreshToken: string }>(
    "/auth/refresh-token",
    { body: { refreshToken } },
  );
}

/** §1.5 */
export function logoutApi(accessToken: string, refreshToken: string) {
  return circleRequest<unknown>("/auth/logout", {
    accessToken,
    body: { refreshToken },
  });
}

/** §2.1 */
export function getMyProfile(accessToken: string) {
  return circleRequest<CircleProfile>("/users/me", { accessToken });
}

/** §2.2 */
export function updateMyProfile(
  accessToken: string,
  body: Partial<{
    username: string;
    email: string;
    avatar_url: string;
  }>,
) {
  return circleRequest<CircleProfile>("/users/me", {
    method: "PUT",
    accessToken,
    body,
  });
}

export type ListPublicEventsParams = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

/** §3.1 — envelope includes top-level `meta` (not inside `data`) */
export async function listPublicEvents(params: ListPublicEventsParams = {}) {
  const base = getCircleApiBase();
  if (!base) {
    throw new CircleApiError("Circle API is not configured", 0);
  }
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.status) sp.set("status", params.status);
  if (params.search) sp.set("search", params.search);
  const q = sp.toString();
  const res = await fetch(`${base}/events${q ? `?${q}` : ""}`);
  const json = (await res.json()) as {
    success?: boolean;
    message?: string;
    data?: CircleEvent[];
    meta?: CircleListMeta;
  };
  if (!res.ok || json.success === false) {
    throw new CircleApiError(json.message ?? res.statusText, res.status, json);
  }
  const data = Array.isArray(json.data) ? json.data : [];
  const meta = json.meta ?? {
    total: data.length,
    page: params.page ?? 1,
    limit: params.limit ?? (data.length || 20),
    totalPages: 1,
  };
  return { data, meta };
}

/** §3.2 */
export function getEventBySlug(slug: string, accessToken?: string | null) {
  return circleRequest<CircleEvent>(`/events/slug/${encodeURIComponent(slug)}`, {
    accessToken: accessToken ?? undefined,
  });
}

/** §3.3 */
export function getEventById(id: string, accessToken?: string | null) {
  return circleRequest<CircleEvent>(`/events/${encodeURIComponent(id)}`, {
    accessToken: accessToken ?? undefined,
  });
}

/** §3.4 */
export function createEvent(
  accessToken: string,
  body: Record<string, unknown>,
) {
  return circleRequest<CircleEvent>("/events", { accessToken, body });
}

/** §3.5 */
export function updateEvent(
  accessToken: string,
  id: string,
  body: Record<string, unknown>,
) {
  return circleRequest<CircleEvent>(`/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    accessToken,
    body,
  });
}

/** §3.6 */
export function publishEvent(accessToken: string, id: string) {
  return circleRequest<CircleEvent>(
    `/events/${encodeURIComponent(id)}/publish`,
    { method: "PUT", accessToken },
  );
}

/** §3.7 */
export function cancelEventAsHost(accessToken: string, id: string) {
  return circleRequest<unknown>(`/events/${encodeURIComponent(id)}/cancel`, {
    method: "PUT",
    accessToken,
  });
}

/** §3.8 */
export function deleteEvent(accessToken: string, id: string) {
  return circleRequest<unknown>(`/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken,
  });
}

/** §3.9 */
export function getMyHostedEvents(accessToken: string) {
  return circleRequest<CircleEvent[]>("/events/my", { accessToken });
}

/** §3.10 */
export function broadcastToAttendees(
  accessToken: string,
  id: string,
  body: CircleBroadcastBody,
) {
  return circleRequest<unknown>(
    `/events/${encodeURIComponent(id)}/broadcast`,
    { accessToken, body },
  );
}

/** §3.11 */
export function exportEventApplicationsCsv(accessToken: string, id: string) {
  return circleRequestBlob(
    `/events/${encodeURIComponent(id)}/export/csv`,
    accessToken,
  );
}

/** §4.1 */
export function getEventQuestions(eventId: string) {
  return circleRequest<CircleEventQuestion[]>(
    `/events/${encodeURIComponent(eventId)}/questions`,
  );
}

/** §4.2 */
export function addEventQuestion(
  accessToken: string,
  eventId: string,
  body: CircleEventQuestionInput,
) {
  return circleRequest<CircleEventQuestion>(
    `/events/${encodeURIComponent(eventId)}/questions`,
    { accessToken, body },
  );
}

/** §4.3 */
export function updateEventQuestion(
  accessToken: string,
  eventId: string,
  questionId: string,
  body: Partial<CircleEventQuestionInput>,
) {
  return circleRequest<CircleEventQuestion>(
    `/events/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(questionId)}`,
    { method: "PUT", accessToken, body },
  );
}

/** §4.4 */
export function deleteEventQuestion(
  accessToken: string,
  eventId: string,
  questionId: string,
) {
  return circleRequest<unknown>(
    `/events/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(questionId)}`,
    { method: "DELETE", accessToken },
  );
}

/** Map verify-otp / Google user payload to profile-shaped user */
export function mapAuthUserToProfile(u: CircleAuthUser): CircleProfile {
  return {
    id: u.id,
    phone: u.phone,
    username: u.username,
    email: u.email,
    verification_tier: u.verification_tier,
    is_profile_complete: u.is_profile_complete,
  };
}
