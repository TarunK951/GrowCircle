import type { EventFaq, MeetEvent } from "@/lib/types";

export type ResolvedEventDetail = {
  spotsTaken: number;
  moreAbout: string;
  whatsIncluded: string[];
  allowedAndNotes: string;
  houseRules: { dos: string[]; donts: string[] };
  faqs: EventFaq[];
};

function stableRatio(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 0.28 + (h % 45) / 100; /* ~0.28–0.72 of capacity “taken” */
}

/** Fills optional detail fields so the event page always has copy to render. */
export function resolveEventDetail(event: MeetEvent): ResolvedEventDetail {
  const spotsTaken =
    event.spotsTaken ??
    Math.min(
      event.capacity,
      Math.max(0, Math.floor(event.capacity * stableRatio(event.id))),
    );

  const moreAbout =
    event.moreAbout?.trim() ||
    `${event.description} The host keeps groups small so everyone gets a real conversation — arrive on time, stay for the full experience, and you’ll leave with a few new names saved in your phone.`;

  const whatsIncluded =
    event.whatsIncluded?.length ? event.whatsIncluded : ["Hosted introductions", "Venue access for the session"];

  const allowedAndNotes =
    event.allowedAndNotes?.trim() ||
    "Be respectful of the venue and neighbors. If you have dietary or accessibility needs, message the host after you join.";

  const houseRules = event.houseRules ?? {
    dos: ["Arrive within the first 15 minutes", "Introduce yourself to someone new", "Follow host cues for rotations"],
    donts: ["No unsolicited sales pitches", "Don’t share others’ contact info without consent", "No recording without asking the room"],
  };

  const faqs: EventFaq[] =
    event.faqs?.length ? event.faqs : [
      { q: "What if I’m running late?", a: "Message the host from your booking — they’ll share whether a late entry still works for this format." },
      { q: "Can I bring a friend?", a: "If spots remain, grab another ticket. Otherwise join the waitlist if the host enables it." },
      { q: "How do refunds work?", a: "This is a mock prototype — in a real app, the host’s policy would show here." },
    ];

  return {
    spotsTaken: Math.min(Math.max(0, spotsTaken), event.capacity),
    moreAbout,
    whatsIncluded,
    allowedAndNotes,
    houseRules,
    faqs,
  };
}
