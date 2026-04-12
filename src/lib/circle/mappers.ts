import type { CircleEvent, CircleProfile } from "@/lib/circle/types";
import type { MeetEvent, PreJoinQuestion, User } from "@/lib/types";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop";

/** Shown when Circle omits `cover_image_url` — used to detect “weak” API rows during hosted sync. */
export const DEFAULT_MEET_EVENT_COVER_URL =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80";

function priceToCents(price: string | number | undefined): number {
  if (price === undefined || price === null) return 0;
  const n = typeof price === "number" ? price : Number.parseFloat(price);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** Map remote Circle profile to app `User` */
export function circleProfileToUser(profile: CircleProfile): User {
  const name =
    profile.username?.trim() ||
    profile.email?.split("@")[0]?.trim() ||
    profile.phone?.trim() ||
    "Member";
  return {
    id: profile.id,
    name,
    email: profile.email ?? "",
    avatar: profile.avatar_url?.trim() || DEFAULT_AVATAR,
    cityId: "circle",
    interests: [],
    verified: (profile.verification_tier ?? 0) >= 1,
    isProfileComplete: profile.is_profile_complete === true,
  };
}

export type CircleEventToMeetOpts = {
  /** When the API omits `host` (some publish / my-events payloads), use the signed-in user id. */
  defaultHostUserId?: string;
};

/** Map published API event to `MeetEvent` for existing UI */
export function circleEventToMeetEvent(
  api: CircleEvent,
  opts?: CircleEventToMeetOpts,
): MeetEvent {
  const hostId =
    api.host?.id ?? opts?.defaultHostUserId ?? "unknown_host";
  const priceCents = priceToCents(api.price);
  const imageUrls = (api.image_urls ?? [])
    .map((url) => url.trim())
    .filter(Boolean);
  const cover = api.cover_image_url?.trim() ?? "";
  const image = cover || imageUrls[0] || "";
  const additionalImages = imageUrls.filter((url) => url !== image);

  let preJoin: PreJoinQuestion[] | undefined;
  if (api.questions?.length) {
    const rows = api.questions
      .filter(
        (q) =>
          q.question_type === "single_select" ||
          q.question_type === "multi_select",
      )
      .map((q, i) => ({
        id: q.id || `q_${i}`,
        prompt: q.question_text,
        options:
          q.options && q.options.length >= 2
            ? q.options
            : ["Option A", "Option B"],
        allowMultiple: q.question_type === "multi_select",
      }));
    if (rows.length) preJoin = rows;
  }

  return {
    id: api.id,
    title: api.title,
    description: api.description ?? "",
    cityId: "circle",
    hostUsername: api.host?.username?.trim() || undefined,
    displayLocation: api.location?.trim() || undefined,
    startsAt: api.event_date,
    hostUserId: hostId,
    capacity: Math.max(1, api.max_capacity ?? 0),
    category: "Social",
    categories: ["Social"],
    image,
    additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
    priceCents,
    venueName: api.location?.split(",")[0]?.trim() || undefined,
    addressLine: api.location?.trim() || undefined,
    joinMode: "open",
    listingVisibility:
      api.visibility === "private" ? "private" : "public",
    spotsTaken: 0,
    preJoinQuestions: preJoin,
    slug: api.slug,
  };
}
