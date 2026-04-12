import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { User } from "@/lib/types";

const STORE_PATH = path.join(process.cwd(), "data", "auth-users.json");

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

type StoreFile = { users: StoredUser[] };

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop";

async function readStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as StoreFile;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return { users: [] };
    throw e;
  }
}

async function writeStore(store: StoreFile): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

let chain = Promise.resolve();

function locked<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export function toPublicUser(u: StoredUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: DEFAULT_AVATAR,
    cityId: "blr",
    interests: [],
    verified: false,
  };
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  const store = await readStore();
  const em = email.toLowerCase();
  return store.users.find((x) => x.email === em);
}

export async function createStoredUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<StoredUser> {
  return locked(async () => {
    const store = await readStore();
    const em = input.email.toLowerCase();
    if (store.users.some((u) => u.email === em)) {
      throw Object.assign(new Error("EMAIL_EXISTS"), { code: "EMAIL_EXISTS" });
    }
    const user: StoredUser = {
      id: `u_${Math.random().toString(36).slice(2, 12)}`,
      email: em,
      name: input.name.trim(),
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    await writeStore(store);
    return user;
  });
}
