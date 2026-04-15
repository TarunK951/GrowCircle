import { circleRequest } from "@/lib/circle/client";
import type {
  CirclePayoutAccount,
  CirclePayoutAccountCreateBody,
} from "@/lib/circle/types";

/** GET /payout-accounts */
export function listPayoutAccounts(accessToken: string) {
  return circleRequest<CirclePayoutAccount[]>("/payout-accounts", {
    accessToken,
  });
}

/** POST /payout-accounts */
export function createPayoutAccount(
  accessToken: string,
  body: CirclePayoutAccountCreateBody,
) {
  return circleRequest<CirclePayoutAccount>("/payout-accounts", {
    method: "POST",
    accessToken,
    body,
  });
}

/** PUT /payout-accounts/:id/primary */
export function setPrimaryPayoutAccount(
  accessToken: string,
  accountId: string,
) {
  return circleRequest<unknown>(
    `/payout-accounts/${encodeURIComponent(accountId)}/primary`,
    { method: "PUT", accessToken },
  );
}

/** DELETE /payout-accounts/:id */
export function deletePayoutAccount(accessToken: string, accountId: string) {
  return circleRequest<unknown>(
    `/payout-accounts/${encodeURIComponent(accountId)}`,
    { method: "DELETE", accessToken },
  );
}
