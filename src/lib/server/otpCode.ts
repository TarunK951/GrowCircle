import { createHash, randomInt, timingSafeEqual } from "node:crypto";

function otpSecret(): string {
  return (
    process.env.EMAIL_OTP_SECRET ||
    process.env.AUTH_SECRET ||
    "growcircle-dev-email-otp-insecure"
  );
}

/** 6-digit numeric string */
export function generateOtpDigits(): string {
  return String(randomInt(100_000, 1_000_000));
}

export function hashEmailOtp(
  email: string,
  purpose: string,
  code: string,
): string {
  const h = createHash("sha256");
  h.update(otpSecret(), "utf8");
  h.update("|", "utf8");
  h.update(email.toLowerCase(), "utf8");
  h.update("|", "utf8");
  h.update(purpose, "utf8");
  h.update("|", "utf8");
  h.update(code, "utf8");
  return h.digest("hex");
}

export function verifyEmailOtpHash(
  email: string,
  purpose: string,
  code: string,
  storedHex: string,
): boolean {
  try {
    const expected = Buffer.from(hashEmailOtp(email, purpose, code), "hex");
    const actual = Buffer.from(storedHex, "hex");
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
