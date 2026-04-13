/**
 * Circle HTTP paths align with API doc sections noted inline (auth §1, users §2, events §3, …).
 * `applicationsApi.ts` covers §5–8; `mediaApi.ts` §14; `settlementsApi` / `adminApi` as labeled there.
 */
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

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

/** String or explicit `null` when key present; `undefined` if all keys absent. */
function pickNullableStr(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | null | undefined {
  for (const k of keys) {
    if (!(k in obj)) continue;
    const v = obj[k];
    if (v === null) return null;
    if (typeof v === "string") return v;
  }
  return undefined;
}

/** §2.1 — backend may emit camelCase or snake_case on user objects. */
export function normalizeCircleProfile(raw: unknown): CircleProfile {
  if (!raw || typeof raw !== "object") {
    throw new CircleApiError("Invalid profile response", 500, raw);
  }
  const o = raw as Record<string, unknown>;
  const id = pickStr(o, "id");
  if (!id) {
    throw new CircleApiError("Invalid profile: missing id", 500, raw);
  }
  const phoneRaw = o.phone;
  const phone: string | null =
    phoneRaw === null || phoneRaw === undefined
      ? null
      : typeof phoneRaw === "string"
        ? phoneRaw
        : null;
  const username =
    typeof o.username === "string" || o.username === null ? o.username : undefined;
  const email = typeof o.email === "string" || o.email === null ? o.email : undefined;
  const dob = typeof o.dob === "string" || o.dob === null ? o.dob : undefined;
  const av = o.avatar_url ?? o.avatarUrl;
  const avatar_url =
    av === null ? null : typeof av === "string" ? av : undefined;
  const ct = o.created_at ?? o.createdAt;
  const created_at = typeof ct === "string" ? ct : undefined;
  const verification_tier =
    typeof o.verification_tier === "number" ? o.verification_tier : undefined;
  const is_globally_banned =
    typeof o.is_globally_banned === "boolean" ? o.is_globally_banned : undefined;
  const is_profile_complete =
    o.is_profile_complete === true || o.isProfileComplete === true;

  const bio = pickNullableStr(o, "bio");
  const city = pickNullableStr(o, "city");
  const dietary_preference = pickNullableStr(
    o,
    "dietary_preference",
    "dietaryPreference",
  );
  const emergency_contact_name = pickNullableStr(
    o,
    "emergency_contact_name",
    "emergencyContactName",
  );
  const emergency_contact_phone = pickNullableStr(
    o,
    "emergency_contact_phone",
    "emergencyContactPhone",
  );
  const google_id = pickNullableStr(o, "google_id", "googleId");
  const last_active_at = pickNullableStr(o, "last_active_at", "lastActiveAt");
  const updated_at = pickNullableStr(o, "updated_at", "updatedAt");

  let email_verified: boolean | undefined;
  if (typeof o.email_verified === "boolean") email_verified = o.email_verified;
  else if (typeof o.emailVerified === "boolean") email_verified = o.emailVerified;

  let profile_completion_score: number | undefined;
  if (typeof o.profile_completion_score === "number")
    profile_completion_score = o.profile_completion_score;
  else if (typeof o.profileCompletionScore === "number")
    profile_completion_score = o.profileCompletionScore;

  return {
    id,
    phone,
    username,
    email,
    dob,
    avatar_url: avatar_url ?? undefined,
    verification_tier,
    is_profile_complete,
    is_globally_banned,
    created_at,
    bio,
    city,
    dietary_preference,
    emergency_contact_name,
    emergency_contact_phone,
    email_verified,
    google_id,
    last_active_at,
    profile_completion_score,
    updated_at,
  };
}

export function isCircleProfileComplete(profile: CircleProfile): boolean {
  return profile.is_profile_complete === true;
}

/** Backend may return camelCase (per API doc) or snake_case. */
function normalizeTokenPair(raw: unknown): { accessToken: string; refreshToken: string } {
  if (!raw || typeof raw !== "object") {
    throw new CircleApiError("Invalid token response", 500, raw);
  }
  const o = raw as Record<string, unknown>;
  const accessToken = pickStr(o, "accessToken", "access_token");
  const refreshToken = pickStr(o, "refreshToken", "refresh_token");
  if (!accessToken || !refreshToken) {
    throw new CircleApiError("Missing access or refresh token in auth response", 500, raw);
  }
  return { accessToken, refreshToken };
}

function normalizeVerifyOtpData(raw: unknown): VerifyOtpData {
  if (!raw || typeof raw !== "object") {
    throw new CircleApiError("Invalid verify response", 500, raw);
  }
  const o = raw as Record<string, unknown>;
  const tokens = normalizeTokenPair(o);
  const userObj = o.user;
  if (!userObj || typeof userObj !== "object") {
    throw new CircleApiError("Missing user in verify response", 500, raw);
  }
  const u = userObj as Record<string, unknown>;
  const id = pickStr(u, "id");
  const phone = pickStr(u, "phone");
  if (!id || !phone) {
    throw new CircleApiError("Invalid user in verify response", 500, raw);
  }
  const isProfileComplete =
    o.isProfileComplete === true ||
    o.is_profile_complete === true ||
    u.is_profile_complete === true ||
    u.isProfileComplete === true;
  const user: CircleAuthUser = {
    id,
    phone,
    username:
      typeof u.username === "string" || u.username === null ? u.username : undefined,
    email: typeof u.email === "string" || u.email === null ? u.email : undefined,
    verification_tier: typeof u.verification_tier === "number" ? u.verification_tier : undefined,
    is_profile_complete:
      u.is_profile_complete === true || u.isProfileComplete === true,
  };
  return {
    ...tokens,
    isNewUser: o.isNewUser === true || o.is_new_user === true,
    isProfileComplete,
    user,
  };
}

/** §1.1 — body must include `phone` (E.164). Email-only OTP is not supported by the API. */
export function sendOtp(phone: string) {
  return circleRequest<unknown>("/auth/send-otp", { body: { phone } });
}

/** §1.2 — `phone` + `otp` (same identifiers as §1.1). */
export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpData> {
  const raw = await circleRequest<unknown>("/auth/verify-otp", {
    body: { phone, otp },
  });
  return normalizeVerifyOtpData(raw);
}

/** §1.3 */
export async function completeProfile(
  accessToken: string,
  body: { username: string; email: string; dob: string },
): Promise<CircleProfile> {
  const raw = await circleRequest<unknown>("/auth/complete-profile", {
    accessToken,
    body,
  });
  return normalizeCircleProfile(raw);
}

/** §1.4 */
export async function refreshTokens(refreshToken: string) {
  const raw = await circleRequest<unknown>("/auth/refresh-token", {
    body: { refreshToken },
  });
  return normalizeTokenPair(raw);
}

/** §1.5 */
export function logoutApi(accessToken: string, refreshToken: string) {
  return circleRequest<unknown>("/auth/logout", {
    accessToken,
    body: { refreshToken },
  });
}

/** §2.1 */
export async function getMyProfile(accessToken: string): Promise<CircleProfile> {
  const raw = await circleRequest<unknown>("/users/me", { accessToken });
  return normalizeCircleProfile(raw);
}

/** §2.2 — snake_case keys; backend may ignore unknown fields until documented. */
export async function updateMyProfile(
  accessToken: string,
  body: Partial<{
    username: string;
    email: string;
    avatar_url: string;
    /** ISO date `YYYY-MM-DD` — sent when backend supports it on §2.2 */
    dob: string;
    bio: string;
    city: string;
    dietary_preference: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
  }>,
): Promise<CircleProfile> {
  const raw = await circleRequest<unknown>("/users/me", {
    method: "PUT",
    accessToken,
    body,
  });
  return normalizeCircleProfile(raw);
}

export type ListPublicEventsParams = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
};

export type ListAdvancedEventsParams = {
  category?: string;
  city?: string;
  tags?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  featured?: boolean;
  sort?: "date" | "price" | "popularity" | "rating";
  page?: number;
  limit?: number;
};

/** §3.1 — envelope includes top-level `meta` (not inside `data`) */
export async function listPublicEvents(params: ListPublicEventsParams = {}) {
  const base = getCircleApiBase();
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

/** §3.x — advanced public search endpoint (`/events/search/advanced`). */
export async function listAdvancedEvents(params: ListAdvancedEventsParams = {}) {
  const base = getCircleApiBase();
  const sp = new URLSearchParams();
  if (params.category) sp.set("category", params.category);
  if (params.city) sp.set("city", params.city);
  if (params.tags) sp.set("tags", params.tags);
  if (params.minPrice != null) sp.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) sp.set("maxPrice", String(params.maxPrice));
  if (params.startDate) sp.set("startDate", params.startDate);
  if (params.endDate) sp.set("endDate", params.endDate);
  if (params.featured != null) sp.set("featured", String(params.featured));
  if (params.sort) sp.set("sort", params.sort);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const res = await fetch(`${base}/events/search/advanced${q ? `?${q}` : ""}`);
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

export * from "./applicationsApi";
