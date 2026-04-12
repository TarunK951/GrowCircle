import type { User } from "@/lib/types";

/** Resolve a user by id — no local seed data; use API-backed fields where available. */
export function lookupUser(_id: string): User | undefined {
  return undefined;
}
