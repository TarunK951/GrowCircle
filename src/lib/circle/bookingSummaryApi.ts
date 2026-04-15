import { circleRequest } from "@/lib/circle/client";
import type { CircleBookingSummaryData } from "@/lib/circle/types";

/** GET /applications/:applicationId/booking-summary */
export function getBookingSummary(
  accessToken: string,
  applicationId: string,
) {
  return circleRequest<CircleBookingSummaryData>(
    `/applications/${encodeURIComponent(applicationId)}/booking-summary`,
    { accessToken },
  );
}
