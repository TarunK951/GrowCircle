import { circleRequest } from "@/lib/circle/client";
import type {
  CircleBlacklistRow,
  CircleCreateBlacklistBody,
} from "@/lib/circle/types";

/** §13.1 */
export function createBlacklist(
  accessToken: string,
  body: CircleCreateBlacklistBody,
) {
  return circleRequest<CircleBlacklistRow>("/blacklists", {
    accessToken,
    body,
  });
}

/** §13.2 */
export function removeBlacklist(accessToken: string, userId: string) {
  return circleRequest<unknown>(`/blacklists/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    accessToken,
  });
}

/** §13.3 */
export function getMyBlacklists(accessToken: string) {
  return circleRequest<CircleBlacklistRow[]>("/blacklists/my", { accessToken });
}
