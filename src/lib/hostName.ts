import type { MeetEvent, User } from "@/lib/types";

/** Legacy helper — no local seed lookup; prefer `event.hostUsername`. */
export function hostNameForUserId(_id: string): string | undefined {
  return undefined;
}

/** Card / list label: current user as host, API username, then "Host". */
export function hostLabelForEvent(
  event: MeetEvent,
  currentUser: User | null | undefined,
): string {
  if (currentUser && event.hostUserId === currentUser.id) {
    return currentUser.name;
  }
  const fromApi = event.hostUsername?.trim();
  if (fromApi) return fromApi;
  return hostNameForUserId(event.hostUserId) ?? "Host";
}
