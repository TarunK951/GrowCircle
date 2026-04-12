import type { EventFaq, MeetEvent } from "@/lib/types";

export type ResolvedEventDetail = {
  spotsTaken: number;
  moreAbout: string;
  whatsIncluded: string[];
  allowedAndNotes: string;
  houseRules: { dos: string[]; donts: string[] };
  faqs: EventFaq[];
};

type ResolveOpts = {
  /** When set (e.g. user-hosted meets), replaces computed spots taken. */
  overrideSpotsTaken?: number;
};

export function resolveEventDetail(
  event: MeetEvent,
  opts?: ResolveOpts,
): ResolvedEventDetail {
  const spotsTaken =
    opts?.overrideSpotsTaken !== undefined
      ? opts.overrideSpotsTaken
      : event.spotsTaken ?? 0;

  const moreAbout = event.moreAbout?.trim() ?? "";

  const whatsIncluded = event.whatsIncluded?.length ? event.whatsIncluded : [];

  const allowedAndNotes = event.allowedAndNotes?.trim() ?? "";

  const houseRules = event.houseRules ?? { dos: [], donts: [] };

  const faqs: EventFaq[] = event.faqs?.length ? event.faqs : [];

  return {
    spotsTaken: Math.min(Math.max(0, spotsTaken), event.capacity),
    moreAbout,
    whatsIncluded,
    allowedAndNotes,
    houseRules,
    faqs,
  };
}
