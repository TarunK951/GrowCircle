import usersSeed from "@/data/users.seed.json";
import type { MeetEvent, User } from "@/lib/types";

const nameByUserId = Object.fromEntries(
  (usersSeed as User[]).map((u) => [u.id, u.name]),
);

export function hostNameForUserId(id: string): string | undefined {
  return nameByUserId[id];
}

/** Card / list label: current user as host, API username, then seed lookup. */
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
