import { NextResponse } from "next/server";
import { emptyGeoHint, hintFromLatLng } from "@/lib/geo/reverseGeocodeHint";
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
      return NextResponse.json(emptyGeoHint());
    }
    const data = (await res.json()) as IpApiLite;
    if (data.error === true || data.reserved === true) {
      return NextResponse.json(emptyGeoHint());
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
      regionLabel: data.region ?? null,
      countryCode: data.country_code ?? null,
    });
  } catch {
    return NextResponse.json(emptyGeoHint());
  }
}

/**
 * Body: `{ "lat": number, "lng": number }` from `navigator.geolocation`.
 * Reverse-geocodes on the server and maps to a catalog city id when possible.
 */
export async function POST(req: Request) {
  let body: { lat?: unknown; lng?: unknown };
  try {
    body = (await req.json()) as { lat?: unknown; lng?: unknown };
  } catch {
    return NextResponse.json(emptyGeoHint(), { status: 400 });
  }

  const lat =
    typeof body.lat === "number" ? body.lat : Number.parseFloat(String(body.lat));
  const lng =
    typeof body.lng === "number" ? body.lng : Number.parseFloat(String(body.lng));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return NextResponse.json(emptyGeoHint(), { status: 400 });
  }

  try {
    const hint = await hintFromLatLng(lat, lng);
    return NextResponse.json(hint);
  } catch {
    return NextResponse.json(emptyGeoHint());
  }
}
