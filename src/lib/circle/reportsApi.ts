import { circleRequest } from "@/lib/circle/client";
import type { CircleReportRow, CircleSubmitReportBody } from "@/lib/circle/types";

/** §12.1 */
export function submitReport(
  accessToken: string,
  body: CircleSubmitReportBody,
) {
  return circleRequest<CircleReportRow>("/reports", {
    accessToken,
    body,
  });
}

/** §12.2 */
export function getMyReports(accessToken: string) {
  return circleRequest<CircleReportRow[]>("/reports/my", { accessToken });
}
