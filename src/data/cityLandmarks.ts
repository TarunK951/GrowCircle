export type CityLandmark = {
  id: string;
  landmark: string;
  icon:
    | "community"
    | "landmark"
    | "building"
    | "bridge"
    | "waves"
    | "tower";
};

export const CITY_LANDMARKS: CityLandmark[] = [
  {
    id: "circle",
    landmark: "Community",
    icon: "community",
  },
  {
    id: "blr",
    landmark: "Vidhana Soudha",
    icon: "building",
  },
  {
    id: "mum",
    landmark: "Gateway of India",
    icon: "landmark",
  },
  {
    id: "del",
    landmark: "India Gate",
    icon: "landmark",
  },
  {
    id: "hyd",
    landmark: "Charminar",
    icon: "tower",
  },
  {
    id: "chen",
    landmark: "Marina Beach",
    icon: "waves",
  },
  {
    id: "kol",
    landmark: "Howrah Bridge",
    icon: "bridge",
  },
  {
    id: "pun",
    landmark: "Shaniwar Wada",
    icon: "building",
  },
  {
    id: "ahm",
    landmark: "Sabarmati Riverfront",
    icon: "waves",
  },
  {
    id: "sf",
    landmark: "Golden Gate",
    icon: "bridge",
  },
  {
    id: "nyc",
    landmark: "Brooklyn Bridge",
    icon: "bridge",
  },
  {
    id: "lon",
    landmark: "Tower Bridge",
    icon: "bridge",
  },
  {
    id: "sg",
    landmark: "Marina Bay",
    icon: "tower",
  },
];

const byId = Object.fromEntries(CITY_LANDMARKS.map((c) => [c.id, c]));

export function getLandmarkForCityId(id: string): CityLandmark | undefined {
  return byId[id];
}
