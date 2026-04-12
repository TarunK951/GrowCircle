/**
 * Landmark imagery for city picker (Unsplash). Matches `cities.json` ids.
 */
export type CityLandmark = {
  id: string;
  /** Short label shown under the city name */
  landmark: string;
  image: string;
};

export const CITY_LANDMARKS: CityLandmark[] = [
  {
    id: "circle",
    landmark: "Community",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "blr",
    landmark: "Vidhana Soudha",
    image:
      "https://images.unsplash.com/photo-1596176530529-78199a4bc718?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "mum",
    landmark: "Gateway of India",
    image:
      "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "del",
    landmark: "India Gate",
    image:
      "https://images.unsplash.com/photo-1587474260584-2494873a30d8?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "hyd",
    landmark: "Charminar",
    image:
      "https://images.unsplash.com/photo-1590050752117-30e55f21579b?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "chen",
    landmark: "Marina Beach",
    image:
      "https://images.unsplash.com/photo-1582510003499-9f89a0a16d4b?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "kol",
    landmark: "Howrah Bridge",
    image:
      "https://images.unsplash.com/photo-1554230501608-76f8c4e5d1a2?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "pun",
    landmark: "Shaniwar Wada",
    image:
      "https://images.unsplash.com/photo-1597074862467-318ef3a0b5c4?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "ahm",
    landmark: "Sabarmati Riverfront",
    image:
      "https://images.unsplash.com/photo-1612438214902-8970a87b8498?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "sf",
    landmark: "Golden Gate",
    image:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "nyc",
    landmark: "Brooklyn Bridge",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "lon",
    landmark: "Tower Bridge",
    image:
      "https://images.unsplash.com/photo-1513635269975-5966636a4d0b?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: "sg",
    landmark: "Marina Bay",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80&auto=format&fit=crop",
  },
];

const byId = Object.fromEntries(CITY_LANDMARKS.map((c) => [c.id, c]));

export function getLandmarkForCityId(id: string): CityLandmark | undefined {
  return byId[id];
}
