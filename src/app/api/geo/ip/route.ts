import { NextRequest, NextResponse } from "next/server";

type IpApiCo = {
  error?: boolean;
  reason?: string;
  latitude?: number;
  longitude?: number;
};

/**
 * Approximate lat/lon for the caller (from `x-forwarded-for` / `x-real-ip`).
 * Uses ipapi.co from the server (same provider as `GET /api/geo/hint`).
 */
export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const raw =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "";
  const isLocal =
    !raw ||
    raw === "::1" ||
    raw.startsWith("127.") ||
    raw.startsWith("192.168.") ||
    raw.startsWith("10.");

  const target = isLocal ? "" : raw;
  const url = target
    ? `https://ipapi.co/${encodeURIComponent(target)}/json/`
    : "https://ipapi.co/json/";

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "geo_lookup_failed", message: `HTTP ${res.status}` },
        { status: 502 },
      );
    }
    const data = (await res.json()) as IpApiCo;
    if (data.error === true) {
      return NextResponse.json(
        {
          error: "geo_no_coords",
          message: data.reason ?? "Could not resolve coordinates",
        },
        { status: 422 },
      );
    }
    if (
      typeof data.latitude !== "number" ||
      typeof data.longitude !== "number"
    ) {
      return NextResponse.json(
        { error: "geo_no_coords", message: "Missing coordinates in response" },
        { status: 422 },
      );
    }
    return NextResponse.json({
      latitude: data.latitude,
      longitude: data.longitude,
      approximate: true,
      source: isLocal ? "ipapi_egress" : "ip",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "geo_lookup_failed", message }, { status: 502 });
  }
}
