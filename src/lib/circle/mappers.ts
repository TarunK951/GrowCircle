import type { CircleEvent, CircleProfile } from "@/lib/circle/types";
import type { EventFaq, MeetEvent, PreJoinQuestion, User } from "@/lib/types";

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

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function asTagsArray(v: unknown): string[] {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) {
    return v
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
  }
  if (typeof v === "string" && v.trim()) {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeFaqs(raw: unknown): EventFaq[] {
  if (!Array.isArray(raw)) return [];
  const out: EventFaq[] = [];
  for (const row of raw) {
    if (row && typeof row === "object" && "q" in row && "a" in row) {
      const q = (row as { q: unknown }).q;
      const a = (row as { a: unknown }).a;
      if (typeof q === "string" && typeof a === "string") out.push({ q, a });
    }
  }
  return out;
}

function normalizeHouseRules(
  api: CircleEvent,
  loose: Record<string, unknown>,
): { dos: string[]; donts: string[] } | undefined {
  const hr =
    api.house_rules ??
    api.houseRules ??
    loose.house_rules ??
    loose.houseRules;
  if (!hr || typeof hr !== "object") return undefined;
  const dos = asStringArray((hr as { dos?: unknown }).dos);
  const donts = asStringArray((hr as { donts?: unknown }).donts);
  if (!dos.length && !donts.length) return undefined;
  return { dos, donts };
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
  const loose = api as CircleEvent & Record<string, unknown>;
  const hostId =
    api.host?.id ?? opts?.defaultHostUserId ?? "unknown_host";
  const priceCents = priceToCents(api.price);
  const imageUrls = (api.image_urls ?? api.imageUrls ?? [])
    .map((url) => String(url).trim())
    .filter(Boolean);
  const cover =
    (api.cover_image_url ?? api.coverImageUrl ?? "").trim() ||
    (typeof loose.cover_image_url === "string" ? loose.cover_image_url.trim() : "") ||
    (typeof loose.coverImageUrl === "string" ? loose.coverImageUrl.trim() : "");
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

  const capacity = Math.max(1, api.max_capacity ?? 0);
  const spotsRaw =
    typeof api.spots_taken === "number"
      ? api.spots_taken
      : typeof api.spotsTaken === "number"
        ? api.spotsTaken
        : typeof api.registered_count === "number"
          ? api.registered_count
          : typeof loose.spots_taken === "number"
            ? loose.spots_taken
            : typeof loose.spotsTaken === "number"
              ? loose.spotsTaken
              : 0;
  const spotsTaken = Math.min(Math.max(0, spotsRaw), capacity);

  const moreAbout =
    [api.more_about, api.moreAbout, loose.more_about, loose.moreAbout]
      .find((s) => typeof s === "string" && s.trim().length > 0)
      ?.trim() ?? undefined;

  const whatsIncluded = asStringArray(
    api.whats_included ?? api.whatsIncluded ?? loose.whats_included ?? loose.whatsIncluded,
  );
  const guestSuggestions = asStringArray(
    api.guest_suggestions ??
      api.guestSuggestions ??
      loose.guest_suggestions ??
      loose.guestSuggestions,
  );
  const allowedAndNotes =
    [api.allowed_and_notes, api.allowedAndNotes, loose.allowed_and_notes, loose.allowedAndNotes]
      .find((s) => typeof s === "string" && s.trim().length > 0)
      ?.trim() ?? undefined;
  const refundPolicy =
    [api.refund_policy, api.refundPolicy, loose.refund_policy, loose.refundPolicy]
      .find((s) => typeof s === "string" && s.trim().length > 0)
      ?.trim() ?? undefined;

  const faqs = normalizeFaqs(api.faqs ?? loose.faqs);
  const houseRules = normalizeHouseRules(api, loose);

  const rawCategory =
    typeof api.category === "string" && api.category.trim()
      ? api.category.trim()
      : null;
  const tagList = asTagsArray(api.tags ?? loose.tags);
  const categoryLabel = rawCategory ?? "Meet";
  const categoriesFromApi =
    Array.isArray(api.categories) && api.categories.length > 0
      ? api.categories
          .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          .map((c) => c.trim())
      : rawCategory
        ? [...new Set([rawCategory, ...tagList])]
        : tagList.length > 0
          ? [...new Set(["Meet", ...tagList])]
          : ["Meet"];

  return {
    id: api.id,
    title: api.title,
    description: api.description ?? "",
    cityId: "circle",
    hostUsername: api.host?.username?.trim() || undefined,
    displayLocation: api.location?.trim() || undefined,
    startsAt: api.event_date,
    hostUserId: hostId,
    capacity,
    category: categoryLabel,
    categories: categoriesFromApi,
    image,
    additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
    priceCents,
    venueName: api.location?.split(",")[0]?.trim() || undefined,
    addressLine: api.location?.trim() || undefined,
    joinMode: "open",
    listingVisibility:
      api.visibility === "private" ? "private" : "public",
    spotsTaken,
    moreAbout,
    whatsIncluded: whatsIncluded.length > 0 ? whatsIncluded : undefined,
    guestSuggestions: guestSuggestions.length > 0 ? guestSuggestions : undefined,
    allowedAndNotes: allowedAndNotes || undefined,
    houseRules,
    faqs: faqs.length > 0 ? faqs : undefined,
    refundPolicy: refundPolicy || undefined,
    preJoinQuestions: preJoin,
    slug: api.slug,
  };
}
