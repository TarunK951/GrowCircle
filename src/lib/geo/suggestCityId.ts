/** Metro ids we surface for India-only regional UI (see RegionalMeetsSection). */
export const INDIA_METRO_CITY_IDS = new Set([
  "blr",
  "mum",
  "del",
  "hyd",
  "chen",
  "kol",
  "pun",
  "ahm",
]);

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * When IP returns a state/region but an odd city string, map Indian states to a default metro.
 */
function suggestFromIndianRegion(region: string | null | undefined): string | null {
  const r = norm(region);
  if (!r) return null;
  const stateToMetro: [string, string][] = [
    ["karnataka", "blr"],
    ["maharashtra", "mum"],
    ["delhi", "del"],
    ["telangana", "hyd"],
    ["tamil nadu", "chen"],
    ["west bengal", "kol"],
    ["gujarat", "ahm"],
    ["punjab", "del"],
    ["haryana", "del"],
    ["uttar pradesh", "del"],
    ["rajasthan", "del"],
    ["madhya pradesh", "del"],
    ["bihar", "del"],
    ["odisha", "hyd"],
    ["andhra pradesh", "hyd"],
    ["kerala", "chen"],
    ["assam", "kol"],
    ["goa", "pun"],
    ["uttarakhand", "del"],
    ["himachal pradesh", "del"],
    ["jammu", "del"],
    ["kashmir", "del"],
    ["jharkhand", "kol"],
    ["chhattisgarh", "hyd"],
  ];
  for (const [state, id] of stateToMetro) {
    if (r.includes(state)) return id;
  }
  return null;
}

/**
 * Map IP geolocation city names to our `cities.json` ids (best-effort).
 * For India-only callers, filter results with {@link INDIA_METRO_CITY_IDS}.
 */
export function suggestCityIdFromGeo(
  city: string | null | undefined,
  region?: string | null,
  countryCode?: string | null,
): string | null {
  const cc = (countryCode ?? "").toUpperCase();
  const c = norm(city);

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

  if (c && exact[c]) return exact[c];

  if (c) {
    if (cc === "IN" || !cc) {
      if (c.includes("bengaluru") || c.includes("bangalore")) return "blr";
      if (c.includes("mumbai")) return "mum";
      if (
        c.includes("delhi") ||
        c.includes("gurgaon") ||
        c.includes("gurugram") ||
        c.includes("noida")
      )
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
  }

  if (cc === "IN" && region) {
    return suggestFromIndianRegion(region);
  }

  return null;
}
