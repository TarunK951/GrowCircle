import { circleRequest } from "@/lib/circle/client";
import type {
  CircleTicketDetail,
  CircleTicketQrData,
  CircleTicketVerifyPublic,
} from "@/lib/circle/types";

/** §9.1 */
export function getTicket(accessToken: string, applicationId: string) {
  return circleRequest<CircleTicketDetail>(
    `/tickets/${encodeURIComponent(applicationId)}`,
    { accessToken },
  );
}

/** §9.2 */
export function getTicketQr(accessToken: string, applicationId: string) {
  return circleRequest<CircleTicketQrData>(
    `/tickets/${encodeURIComponent(applicationId)}/qr`,
    { accessToken },
  );
}

/** §9.3 — no auth */
export function verifyTicketPublic(token: string) {
  return circleRequest<CircleTicketVerifyPublic>(
    `/tickets/verify/${encodeURIComponent(token)}`,
    {},
  );
}
