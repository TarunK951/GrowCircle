import { NextResponse } from "next/server";
import { suggestCityIdFromGeo } from "@/lib/geo/suggestCityId";

type IpApiLite = {
  city?: string;
  region?: string;
  country_code?: string;
  error?: boolean;
  reason?: string;
  reserved?: boolean;
};

/**
 * Returns a suggested city id from the caller IP (Vercel / proxy aware).
 * Uses ipapi.co from the server — wire a different provider if needed.
 */
export async function GET(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    "";

  try {
    const url = ip
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : "https://ipapi.co/json/";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json({
        suggestedCityId: null as string | null,
        cityLabel: null as string | null,
      });
    }
    const data = (await res.json()) as IpApiLite;
    if (data.error === true || data.reserved === true) {
      return NextResponse.json({
        suggestedCityId: null as string | null,
        cityLabel: null as string | null,
      });
    }
    const city = data.city;
    const suggestedCityId = suggestCityIdFromGeo(
      city,
      data.region,
      data.country_code,
    );
    return NextResponse.json({
      suggestedCityId,
      cityLabel: city ?? null,
    });
  } catch {
    return NextResponse.json({
      suggestedCityId: null as string | null,
      cityLabel: null as string | null,
    });
  }
}
