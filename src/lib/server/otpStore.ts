import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), "data", "email-otp.json");

export type OtpPurpose = "login" | "signup";

export type OtpPendingRecord = {
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: string;
  createdAt: string;
  verifyAttempts: number;
};

type RateEntry = {
  sendTimestamps: string[];
};

type OtpStoreFile = {
  pending: OtpPendingRecord[];
  rateByEmail: Record<string, RateEntry>;
};

const MAX_SENDS_PER_EMAIL_PER_HOUR = 5;
export const MAX_VERIFY_ATTEMPTS = 8;
export const OTP_TTL_MS = 10 * 60 * 1000;

async function readStore(): Promise<OtpStoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as OtpStoreFile;
    if (!parsed.pending) parsed.pending = [];
    if (!parsed.rateByEmail) parsed.rateByEmail = {};
    return parsed;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return { pending: [], rateByEmail: {} };
    throw e;
  }
}

async function writeStore(store: OtpStoreFile): Promise<void> {
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

function pruneOldSends(entry: RateEntry, now: number): void {
  const hourAgo = now - 60 * 60 * 1000;
  entry.sendTimestamps = entry.sendTimestamps.filter((t) => {
    const ts = Date.parse(t);
    return !Number.isNaN(ts) && ts > hourAgo;
  });
}

function checkSendRate(
  rateByEmail: Record<string, RateEntry>,
  email: string,
): { ok: true } | { ok: false; reason: string } {
  const em = email.toLowerCase();
  const now = Date.now();
  const entry = rateByEmail[em] ?? { sendTimestamps: [] };
  pruneOldSends(entry, now);
  if (entry.sendTimestamps.length >= MAX_SENDS_PER_EMAIL_PER_HOUR) {
    return {
      ok: false,
      reason: "Too many codes sent to this email. Try again later.",
    };
  }
  return { ok: true };
}

function recordSend(
  rateByEmail: Record<string, RateEntry>,
  email: string,
): void {
  const em = email.toLowerCase();
  const entry = rateByEmail[em] ?? { sendTimestamps: [] };
  pruneOldSends(entry, Date.now());
  entry.sendTimestamps.push(new Date().toISOString());
  rateByEmail[em] = entry;
}

function pruneExpiredPending(pending: OtpPendingRecord[]): OtpPendingRecord[] {
  const now = Date.now();
  return pending.filter((p) => Date.parse(p.expiresAt) > now);
}

/**
 * Rate-limit, store hashed code, single write (locked).
 */
export async function registerOtpSend(
  email: string,
  purpose: OtpPurpose,
  codeHash: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  return locked(async () => {
    const store = await readStore();
    store.pending = pruneExpiredPending(store.pending);
    const rateCheck = checkSendRate(store.rateByEmail, email);
    if (!rateCheck.ok) return rateCheck;
    recordSend(store.rateByEmail, email);
    const now = Date.now();
    const em = email.toLowerCase();
    const record: OtpPendingRecord = {
      email: em,
      purpose,
      codeHash,
      expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
      createdAt: new Date(now).toISOString(),
      verifyAttempts: 0,
    };
    store.pending = store.pending.filter(
      (p) => !(p.email === em && p.purpose === purpose),
    );
    store.pending.push(record);
    await writeStore(store);
    return { ok: true };
  });
}

export async function getPendingOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<OtpPendingRecord | undefined> {
  const store = await readStore();
  const em = email.toLowerCase();
  const now = Date.now();
  return store.pending.find((p) => {
    if (p.email !== em || p.purpose !== purpose) return false;
    if (Date.parse(p.expiresAt) <= now) return false;
    return true;
  });
}

export async function bumpVerifyAttempts(
  email: string,
  purpose: OtpPurpose,
): Promise<OtpPendingRecord | undefined> {
  return locked(async () => {
    const store = await readStore();
    const em = email.toLowerCase();
    const row = store.pending.find(
      (p) => p.email === em && p.purpose === purpose,
    );
    if (!row) return undefined;
    if (Date.parse(row.expiresAt) <= Date.now()) return undefined;
    row.verifyAttempts += 1;
    await writeStore(store);
    return row;
  });
}

export async function removePendingOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<void> {
  return locked(async () => {
    const store = await readStore();
    const em = email.toLowerCase();
    store.pending = store.pending.filter(
      (p) => !(p.email === em && p.purpose === purpose),
    );
    await writeStore(store);
  });
}
