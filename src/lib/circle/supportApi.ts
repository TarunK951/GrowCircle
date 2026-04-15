import { circleRequest, circleRequestList } from "@/lib/circle/client";
import type {
  CircleDisputeCreateBody,
  CircleDisputeRow,
  CircleSupportTicket,
  CircleSupportTicketCreateBody,
} from "@/lib/circle/types";

export type ListSupportTicketsParams = {
  page?: number;
  limit?: number;
};

/** POST /support/tickets */
export function createSupportTicket(
  accessToken: string,
  body: CircleSupportTicketCreateBody,
) {
  return circleRequest<CircleSupportTicket>("/support/tickets", {
    method: "POST",
    accessToken,
    body,
  });
}

/** GET /support/tickets */
export function listMySupportTickets(
  accessToken: string,
  params: ListSupportTicketsParams = {},
) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CircleSupportTicket>(
    q ? `/support/tickets?${q}` : "/support/tickets",
    { accessToken },
  );
}

export type ListDisputesParams = {
  page?: number;
  limit?: number;
};

/** GET /support/disputes */
export function listMyDisputes(
  accessToken: string,
  params: ListDisputesParams = {},
) {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return circleRequestList<CircleDisputeRow>(
    q ? `/support/disputes?${q}` : "/support/disputes",
    { accessToken },
  );
}

/** POST /support/disputes */
export function createDispute(
  accessToken: string,
  body: CircleDisputeCreateBody,
) {
  return circleRequest<CircleDisputeRow>("/support/disputes", {
    method: "POST",
    accessToken,
    body,
  });
}
