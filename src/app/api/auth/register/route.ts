import { NextResponse } from "next/server";
import { registerBodySchema } from "@/lib/auth/apiSchemas";
import { hashPassword } from "@/lib/server/password";
import { createStoredUser, toPublicUser } from "@/lib/server/authStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = registerBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your name, email, and password." },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const passwordHash = hashPassword(password);
    const stored = await createStoredUser({ name, email, passwordHash });
    return NextResponse.json({ user: toPublicUser(stored) });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "EMAIL_EXISTS") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    console.error("[auth/register]", e);
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 500 },
    );
  }
}
