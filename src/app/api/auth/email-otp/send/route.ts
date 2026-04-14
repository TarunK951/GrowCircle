import { NextResponse } from "next/server";
import { emailOtpSendBodySchema } from "@/lib/auth/apiSchemas";
import { findUserByEmail } from "@/lib/server/authStore";
import { generateOtpDigits, hashEmailOtp } from "@/lib/server/otpCode";
import { registerOtpSend } from "@/lib/server/otpStore";
import { sendOtpEmail } from "@/lib/server/sendOtpEmail";

export const runtime = "nodejs";

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = emailOtpSendBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and purpose." },
      { status: 400 },
    );
  }

  const { email, purpose } = parsed.data;
  const existing = await findUserByEmail(email);

  if (purpose === "login" && !existing) {
    return NextResponse.json(
      {
        error:
          "No account found for this email. Create an account first or use a different email.",
      },
      { status: 401 },
    );
  }
  if (purpose === "signup" && existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const code = generateOtpDigits();
  const codeHash = hashEmailOtp(email, purpose, code);
  const reg = await registerOtpSend(email, purpose, codeHash);
  if (!reg.ok) {
    return NextResponse.json({ error: reg.reason }, { status: 429 });
  }

  await sendOtpEmail({ to: email, code, purpose });

  const devExpose =
    process.env.NODE_ENV === "development" &&
    process.env.EMAIL_OTP_DEV_RETURN === "1";

  const ip = clientIp(req);
  if (process.env.NODE_ENV === "development") {
    console.warn(`[email-otp/send] ${email} purpose=${purpose} ip=${ip || "?"}`);
  }

  return NextResponse.json({
    ok: true,
    ...(devExpose ? { devOtp: code } : {}),
  });
}
