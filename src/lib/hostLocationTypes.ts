/** Stored on the API as `location_type` (snake_case). Slugs are stable for filters and i18n later. */
export const HOST_LOCATION_TYPE_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "", label: "Select type (optional)" },
  { value: "indoor_venue", label: "Indoor venue" },
  { value: "outdoor", label: "Outdoor / open-air" },
  { value: "online", label: "Online / virtual" },
  { value: "private_home", label: "Private home" },
  { value: "cafe_restaurant", label: "Café / restaurant" },
  { value: "coworking", label: "Coworking / workspace" },
  { value: "park_public", label: "Park / public space" },
  { value: "other", label: "Other" },
];

export function labelForLocationType(slug: string | undefined | null): string {
  if (!slug?.trim()) return "";
  const row = HOST_LOCATION_TYPE_OPTIONS.find((o) => o.value === slug.trim());
  return row?.label ?? slug.trim();
}
