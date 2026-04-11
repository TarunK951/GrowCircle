import usersSeed from "@/data/users.seed.json";
import type { User } from "@/lib/types";

const nameByUserId = Object.fromEntries(
  (usersSeed as User[]).map((u) => [u.id, u.name]),
);

export function hostNameForUserId(id: string): string | undefined {
  return nameByUserId[id];
}
