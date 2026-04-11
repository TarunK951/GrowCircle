import { circleRequest } from "@/lib/circle/client";
import type { CircleSettlementRow } from "@/lib/circle/types";

/** §15.1 */
export function getMySettlements(accessToken: string) {
  return circleRequest<CircleSettlementRow[]>("/events/settlements/my", {
    accessToken,
  });
}

/** §15.2 */
export function getSettlementForEvent(accessToken: string, eventId: string) {
  return circleRequest<CircleSettlementRow>(
    `/events/${encodeURIComponent(eventId)}/settlement`,
    { accessToken },
  );
}
