/**
 * Map IP geolocation city names to our `cities.json` ids (best-effort).
 */
export function suggestCityIdFromGeo(
  city: string | null | undefined,
  _region?: string | null,
  countryCode?: string | null,
): string | null {
  if (!city?.trim()) return null;
  const c = city.trim().toLowerCase();
  const cc = (countryCode ?? "").toUpperCase();

  const exact: Record<string, string> = {
    bengaluru: "blr",
    bangalore: "blr",
    mumbai: "mum",
    bombay: "mum",
    delhi: "del",
    "new delhi": "del",
    noida: "del",
    gurugram: "del",
    gurgaon: "del",
    ghaziabad: "del",
    faridabad: "del",
    hyderabad: "hyd",
    chennai: "chen",
    madras: "chen",
    kolkata: "kol",
    calcutta: "kol",
    pune: "pun",
    ahmedabad: "ahm",
    "san francisco": "sf",
    "new york": "nyc",
    london: "lon",
    singapore: "sg",
  };

  if (exact[c]) return exact[c];

  if (cc === "IN") {
    if (c.includes("bengaluru") || c.includes("bangalore")) return "blr";
    if (c.includes("mumbai")) return "mum";
    if (c.includes("delhi") || c.includes("gurgaon") || c.includes("noida"))
      return "del";
    if (c.includes("hyderabad")) return "hyd";
    if (c.includes("chennai")) return "chen";
    if (c.includes("kolkata")) return "kol";
    if (c.includes("pune")) return "pun";
    if (c.includes("ahmedabad")) return "ahm";
  }

  if (cc === "US") {
    if (c.includes("san francisco") || c.includes("sf")) return "sf";
    if (c.includes("new york") || c === "nyc") return "nyc";
  }

  if (cc === "GB" && c.includes("london")) return "lon";
  if (cc === "SG" || c.includes("singapore")) return "sg";

  return null;
}
