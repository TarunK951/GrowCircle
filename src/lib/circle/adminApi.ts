import { circleRequest, circleRequestList } from "@/lib/circle/client";
import type {
  CircleAdminAuditLogsData,
  CircleAdminDashboardStats,
  CircleAdminReportReviewBody,
  CircleAdminUserRow,
  CircleBlacklistRow,
  CircleEvent,
  CirclePresetQuestionAdmin,
  CirclePresetQuestionCreateBody,
  CircleReportRow,
  CircleSettlementRow,
} from "@/lib/circle/types";

/** §16.1 */
export function adminGetDashboard(adminAccessToken: string) {
  return circleRequest<CircleAdminDashboardStats>("/admin/dashboard", {
    accessToken: adminAccessToken,
  });
}

export type AdminListParams = {
  page?: number;
  limit?: number;
};

/** §16.2 */
export function adminListUsers(
  adminAccessToken: string,
  params: AdminListParams = {},
) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CircleAdminUserRow>(
    `/admin/users${q ? `?${q}` : ""}`,
    { accessToken: adminAccessToken },
  );
}

/** §16.3 */
export function adminBanUser(
  adminAccessToken: string,
  userId: string,
  body: { is_banned: boolean },
) {
  return circleRequest<CircleAdminUserRow>(
    `/admin/users/${encodeURIComponent(userId)}/ban`,
    { method: "PUT", accessToken: adminAccessToken, body },
  );
}

/** §16.4 */
export function adminSetUserVerification(
  adminAccessToken: string,
  userId: string,
  body: { tier: number },
) {
  return circleRequest<{ id: string; verification_tier: number }>(
    `/admin/users/${encodeURIComponent(userId)}/verification`,
    { method: "PUT", accessToken: adminAccessToken, body },
  );
}

/** §16.5 */
export function adminListEvents(
  adminAccessToken: string,
  params: AdminListParams = {},
) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CircleEvent>(
    `/admin/events${q ? `?${q}` : ""}`,
    { accessToken: adminAccessToken },
  );
}

/** §16.6 */
export function adminListBlacklists(
  adminAccessToken: string,
  params: AdminListParams = {},
) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CircleBlacklistRow>(
    `/admin/blacklists${q ? `?${q}` : ""}`,
    { accessToken: adminAccessToken },
  );
}

/** §16.7 */
export function adminListPresetQuestions(adminAccessToken: string) {
  return circleRequest<CirclePresetQuestionAdmin[]>("/admin/preset-questions", {
    accessToken: adminAccessToken,
  });
}

/** §16.8 */
export function adminCreatePresetQuestion(
  adminAccessToken: string,
  body: CirclePresetQuestionCreateBody,
) {
  return circleRequest<CirclePresetQuestionAdmin>("/admin/preset-questions", {
    accessToken: adminAccessToken,
    body,
  });
}

/** §16.9 */
export function adminUpdatePresetQuestion(
  adminAccessToken: string,
  id: string,
  body: Partial<CirclePresetQuestionCreateBody>,
) {
  return circleRequest<CirclePresetQuestionAdmin>(
    `/admin/preset-questions/${encodeURIComponent(id)}`,
    { method: "PUT", accessToken: adminAccessToken, body },
  );
}

/** §16.10 */
export function adminDeletePresetQuestion(
  adminAccessToken: string,
  id: string,
) {
  return circleRequest<unknown>(
    `/admin/preset-questions/${encodeURIComponent(id)}`,
    { method: "DELETE", accessToken: adminAccessToken },
  );
}

export type AdminListSettlementsParams = AdminListParams & {
  status?: string;
};

/** §16.11 */
export function adminListSettlements(
  adminAccessToken: string,
  params: AdminListSettlementsParams = {},
) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CircleSettlementRow>(
    `/admin/settlements${q ? `?${q}` : ""}`,
    { accessToken: adminAccessToken },
  );
}

/** §16.12 */
export function adminGetPendingSettlements(adminAccessToken: string) {
  return circleRequest<CircleSettlementRow[]>("/admin/settlements/pending", {
    accessToken: adminAccessToken,
  });
}

/** §16.13 */
export function adminGetSettlementForEvent(
  adminAccessToken: string,
  eventId: string,
) {
  return circleRequest<CircleSettlementRow>(
    `/admin/settlements/event/${encodeURIComponent(eventId)}`,
    { accessToken: adminAccessToken },
  );
}

/** §16.14 */
export function adminSettleEvent(
  adminAccessToken: string,
  eventId: string,
  body: { notes: string },
) {
  return circleRequest<unknown>(
    `/admin/settlements/event/${encodeURIComponent(eventId)}/settle`,
    { method: "POST", accessToken: adminAccessToken, body },
  );
}

export type AdminListReportsParams = AdminListParams & {
  status?: string;
  target_type?: string;
};

/** §16.15 */
export function adminListReports(
  adminAccessToken: string,
  params: AdminListReportsParams = {},
) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.target_type) sp.set("target_type", params.target_type);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CircleReportRow>(
    `/admin/reports${q ? `?${q}` : ""}`,
    { accessToken: adminAccessToken },
  );
}

/** §16.16 */
export function adminReviewReport(
  adminAccessToken: string,
  reportId: string,
  body: CircleAdminReportReviewBody,
) {
  return circleRequest<CircleReportRow>(
    `/admin/reports/${encodeURIComponent(reportId)}/review`,
    { method: "PUT", accessToken: adminAccessToken, body },
  );
}

export type AdminAuditLogsParams = AdminListParams & {
  action?: string;
};

/** §16.17 */
export function adminGetAuditLogs(
  adminAccessToken: string,
  params: AdminAuditLogsParams = {},
) {
  const sp = new URLSearchParams();
  if (params.action) sp.set("action", params.action);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequest<CircleAdminAuditLogsData>(
    `/admin/audit-logs${q ? `?${q}` : ""}`,
    { accessToken: adminAccessToken },
  );
}
