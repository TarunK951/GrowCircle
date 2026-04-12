import { circleRequest, circleRequestList } from "@/lib/circle/client";
import { getCircleApiBase } from "@/lib/circle/config";
import type {
  AcceptOfferData,
  ApplyToEventData,
  CancelApplicationData,
  CheckinEventStatusData,
  CheckinGenerateData,
  CheckinVerifyData,
  CircleApplyAnswer,
  CircleEventApplicationRow,
  CircleMyApplication,
  CirclePaymentDetails,
  SelectApplicationsData,
  UninviteApplicationData,
  WaitlistPositionData,
} from "@/lib/circle/types";

/** §5.1 */
export function applyToEvent(
  accessToken: string,
  eventId: string,
  body: { answers: CircleApplyAnswer[] },
) {
  return circleRequest<ApplyToEventData>(
    `/applications/events/${encodeURIComponent(eventId)}/apply`,
    { accessToken, body },
  );
}

export type ListEventApplicationsParams = {
  status?: string;
  page?: number;
  limit?: number;
};

/** §5.2 */
export function listEventApplications(
  accessToken: string,
  eventId: string,
  params: ListEventApplicationsParams = {},
) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  const path = `/applications/events/${encodeURIComponent(eventId)}${q ? `?${q}` : ""}`;
  return circleRequestList<CircleEventApplicationRow>(path, { accessToken });
}

/** §5.3 */
export function selectEventApplications(
  accessToken: string,
  eventId: string,
  body: { application_ids: string[] },
) {
  return circleRequest<SelectApplicationsData>(
    `/applications/events/${encodeURIComponent(eventId)}/select`,
    { method: "PUT", accessToken, body },
  );
}

/** §5.4 */
export function cancelApplication(accessToken: string, applicationId: string) {
  return circleRequest<CancelApplicationData>(
    `/applications/${encodeURIComponent(applicationId)}/cancel`,
    { method: "PUT", accessToken },
  );
}

/** §5.5 */
export function uninviteApplication(
  accessToken: string,
  applicationId: string,
  body: { reason: string },
) {
  return circleRequest<UninviteApplicationData>(
    `/applications/${encodeURIComponent(applicationId)}/uninvite`,
    { method: "PUT", accessToken, body },
  );
}

/** §5.6 */
export function getMyApplications(accessToken: string) {
  return circleRequest<CircleMyApplication[]>("/applications/me", {
    accessToken,
  });
}

/** §5.7 */
export function getWaitlistPosition(
  accessToken: string,
  applicationId: string,
) {
  return circleRequest<WaitlistPositionData>(
    `/applications/${encodeURIComponent(applicationId)}/waitlist-position`,
    { accessToken },
  );
}

/** §5.8 */
export function acceptWaitlistOffer(
  accessToken: string,
  applicationId: string,
) {
  return circleRequest<AcceptOfferData>(
    `/applications/${encodeURIComponent(applicationId)}/accept-offer`,
    { method: "POST", accessToken },
  );
}

/** §6.1 */
export function getPayment(accessToken: string, paymentId: string) {
  return circleRequest<CirclePaymentDetails>(
    `/payments/${encodeURIComponent(paymentId)}`,
    { accessToken },
  );
}

/** §8.1 */
export function generateCheckinOtp(
  accessToken: string,
  applicationId: string,
) {
  return circleRequest<CheckinGenerateData>(
    `/checkin/${encodeURIComponent(applicationId)}/generate`,
    { method: "POST", accessToken },
  );
}

/** §8.2 */
export function verifyCheckinOtp(
  accessToken: string,
  applicationId: string,
  body: { otp: string },
) {
  return circleRequest<CheckinVerifyData>(
    `/checkin/${encodeURIComponent(applicationId)}/verify`,
    { accessToken, body },
  );
}

/** §8.3 */
export function getEventCheckinStatus(accessToken: string, eventId: string) {
  return circleRequest<CheckinEventStatusData>(
    `/checkin/event/${encodeURIComponent(eventId)}/status`,
    { accessToken },
  );
}

/** True when Circle applications API is available (always when this bundle is built for Circle). */
export function canUseCircleApplicationsApi(): boolean {
  return true;
}
