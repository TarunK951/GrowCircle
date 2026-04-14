import { suggestCityIdFromGeo } from "@/lib/geo/suggestCityId";

export type GeoHintPayload = {
  suggestedCityId: string | null;
  cityLabel: string | null;
  regionLabel: string | null;
  countryCode: string | null;
};

export function emptyGeoHint(): GeoHintPayload {
  return {
    suggestedCityId: null,
    cityLabel: null,
    regionLabel: null,
    countryCode: null,
  };
}

type NominatimReverse = {
  address?: Record<string, string | undefined>;
};

/**
 * Reverse-geocode coordinates via OpenStreetMap Nominatim (server-side only; include User-Agent).
 */
export async function hintFromLatLng(
  lat: number,
  lon: number,
): Promise<GeoHintPayload> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "GrowCircle/1.0 (https://nominatim.openstreetmap.org/usage-policy)",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) return emptyGeoHint();

  const data = (await res.json()) as NominatimReverse;
  const a = data.address ?? {};
  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.county ||
    null;
  const region = a.state || a.region || null;
  const countryCode = a.country_code || null;
  const suggestedCityId = suggestCityIdFromGeo(
    city ?? null,
    region ?? null,
    countryCode,
  );

  return {
    suggestedCityId,
    cityLabel: city ?? null,
    regionLabel: region ?? null,
    countryCode: countryCode ? countryCode.toUpperCase() : null,
  };
}
