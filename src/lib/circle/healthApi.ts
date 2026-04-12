import { getCircleApiBase } from "@/lib/circle/config";
import { CircleApiError } from "@/lib/circle/client";
import type { CircleHealthData } from "@/lib/circle/types";

/**
 * § Health — `GET /health` at server origin (not under `/api`).
 * Strips trailing `/api` from `NEXT_PUBLIC_CIRCLE_API_BASE`.
 */
export async function getHealth(): Promise<CircleHealthData> {
  const base = getCircleApiBase();
  const root = base.replace(/\/api\/?$/, "");
  const url = `${root}/health`;
  const res = await fetch(url);
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    throw new CircleApiError(res.statusText || "Health check failed", res.status);
  }
  if (!ct.includes("application/json")) {
    throw new CircleApiError("Unexpected health response", res.status);
  }
  return (await res.json()) as CircleHealthData;
}
