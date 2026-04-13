import type { MeetEvent } from "@/lib/types";

/**
 * After `GET /events/:id`, merge with an existing catalog row (often the hosted
 * copy in session) so we do not replace non-empty host fields with API `null`s.
 */
export function mergeRemoteDetailWithCatalog(
  remote: MeetEvent,
  catalog: MeetEvent | null,
): MeetEvent {
  if (!catalog) return remote;

  const pickStr = (r?: string, c?: string) => {
    const rt = r?.trim() ?? "";
    const ct = c?.trim() ?? "";
    return rt || ct || undefined;
  };

  const pickArr = (r?: string[], c?: string[]) =>
    r?.filter((x) => x.trim()).length ? r : c?.filter((x) => x.trim()).length ? c : r;

  const remoteHr = remote.houseRules;
  const catHr = catalog.houseRules;
  const remoteHasHr =
    (remoteHr?.dos?.length ?? 0) > 0 || (remoteHr?.donts?.length ?? 0) > 0;
  const catHasHr =
    (catHr?.dos?.length ?? 0) > 0 || (catHr?.donts?.length ?? 0) > 0;

  return {
    ...remote,
    moreAbout: pickStr(remote.moreAbout, catalog.moreAbout),
    whatsIncluded: pickArr(remote.whatsIncluded, catalog.whatsIncluded),
    guestSuggestions: pickArr(remote.guestSuggestions, catalog.guestSuggestions),
    allowedAndNotes: pickStr(remote.allowedAndNotes, catalog.allowedAndNotes),
    eventRules: pickStr(remote.eventRules, catalog.eventRules),
    refundPolicy: pickStr(remote.refundPolicy, catalog.refundPolicy),
    locationType: remote.locationType?.trim()
      ? remote.locationType
      : catalog.locationType,
    houseRules: remoteHasHr ? remoteHr : catHasHr ? catHr : remoteHr,
    faqs: remote.faqs?.length ? remote.faqs : catalog.faqs,
  };
}
