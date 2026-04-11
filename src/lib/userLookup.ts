import usersSeed from "@/data/users.seed.json";
import type { User } from "@/lib/types";

export function lookupUser(id: string): User | undefined {
  return (usersSeed as User[]).find((u) => u.id === id);
}
