import { NextResponse } from "next/server";
import { emailOtpVerifyBodySchema } from "@/lib/auth/apiSchemas";
import {
  createStoredUser,
  findUserByEmail,
  toPublicUser,
} from "@/lib/server/authStore";
import { verifyEmailOtpHash } from "@/lib/server/otpCode";
import {
  bumpVerifyAttempts,
  getPendingOtp,
  MAX_VERIFY_ATTEMPTS,
  removePendingOtp,
} from "@/lib/server/otpStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = emailOtpVerifyBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the code and try again." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const email = data.email;
  const purpose = data.purpose;
  const code = data.code;

  const pending = await getPendingOtp(email, purpose);
  if (!pending) {
    return NextResponse.json(
      { error: "Invalid or expired code." },
      { status: 401 },
    );
  }

  if (pending.verifyAttempts >= MAX_VERIFY_ATTEMPTS) {
    await removePendingOtp(email, purpose);
    return NextResponse.json(
      { error: "Invalid or expired code." },
      { status: 401 },
    );
  }

  const ok = verifyEmailOtpHash(email, purpose, code, pending.codeHash);
  if (!ok) {
    await bumpVerifyAttempts(email, purpose);
    return NextResponse.json(
      { error: "Invalid or expired code." },
      { status: 401 },
    );
  }

  await removePendingOtp(email, purpose);

  try {
    if (purpose === "login") {
      const stored = await findUserByEmail(email);
      if (!stored) {
        return NextResponse.json(
          { error: "Invalid or expired code." },
          { status: 401 },
        );
      }
      return NextResponse.json({ user: toPublicUser(stored) });
    }

    const stored = await createStoredUser({
      name: data.name,
      email,
    });
    return NextResponse.json({ user: toPublicUser(stored) });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "EMAIL_EXISTS") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    console.error("[auth/email-otp/verify]", e);
    return NextResponse.json(
      { error: "Could not complete sign-in. Please try again." },
      { status: 500 },
    );
  }
}
