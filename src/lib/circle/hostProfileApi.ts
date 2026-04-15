import { circleRequest } from "@/lib/circle/client";
import type {
  CircleHostDashboardData,
  CircleHostOnboardingData,
  CircleHostProfile,
  CircleHostRevenuePoint,
} from "@/lib/circle/types";

/** GET /host-profile/me */
export function getHostProfile(accessToken: string) {
  return circleRequest<CircleHostProfile>("/host-profile/me", { accessToken });
}

/** PUT /host-profile/me */
export function updateHostProfile(
  accessToken: string,
  body: Partial<CircleHostProfile>,
) {
  return circleRequest<CircleHostProfile>("/host-profile/me", {
    method: "PUT",
    accessToken,
    body,
  });
}

/** GET /host-profile/me/onboarding */
export function getHostOnboarding(accessToken: string) {
  return circleRequest<CircleHostOnboardingData>(
    "/host-profile/me/onboarding",
    { accessToken },
  );
}

/** GET /host-profile/me/dashboard */
export function getHostDashboard(accessToken: string) {
  return circleRequest<CircleHostDashboardData>(
    "/host-profile/me/dashboard",
    { accessToken },
  );
}

/** GET /host-profile/me/revenue */
export function getHostRevenue(accessToken: string, days = 30) {
  const q = new URLSearchParams();
  q.set("days", String(days));
  return circleRequest<CircleHostRevenuePoint[]>(
    `/host-profile/me/revenue?${q.toString()}`,
    { accessToken },
  );
}

/** GET /host-profile/:hostId/public — public host card (no auth) */
export function getPublicHostProfile(hostId: string) {
  return circleRequest<{
    profile?: CircleHostProfile;
    rating?: { average?: number; total?: number };
    eventCount?: number;
  }>(`/host-profile/${encodeURIComponent(hostId)}/public`);
}
