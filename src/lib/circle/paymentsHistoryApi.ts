import { circleRequestList } from "@/lib/circle/client";
import type { CirclePaymentHistoryRow } from "@/lib/circle/types";

export type ListPaymentHistoryParams = {
  page?: number;
  limit?: number;
};

/** GET /payments/my/history */
export function listMyPaymentHistory(
  accessToken: string,
  params: ListPaymentHistoryParams = {},
) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CirclePaymentHistoryRow>(
    q ? `/payments/my/history?${q}` : "/payments/my/history",
    { accessToken },
  );
}
