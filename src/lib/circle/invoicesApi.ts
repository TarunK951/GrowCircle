import { circleRequestBlob } from "@/lib/circle/client";

/** §10.1 — PDF receipt */
export function downloadApplicationInvoice(
  accessToken: string,
  applicationId: string,
) {
  return circleRequestBlob(
    `/invoices/application/${encodeURIComponent(applicationId)}`,
    accessToken,
  );
}
