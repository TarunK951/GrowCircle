import { NextResponse } from "next/server";
import { loginBodySchema } from "@/lib/auth/apiSchemas";
import { verifyPassword } from "@/lib/server/password";
import { findUserByEmail, toPublicUser } from "@/lib/server/authStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = loginBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email and password." },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  try {
    const stored = await findUserByEmail(email);
    if (
      !stored ||
      !stored.passwordHash ||
      !verifyPassword(password, stored.passwordHash)
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }
    return NextResponse.json({ user: toPublicUser(stored) });
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json(
      { error: "Could not sign in. Please try again." },
      { status: 500 },
    );
  }
}
