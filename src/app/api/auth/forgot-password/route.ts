import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
});

/**
 * Placeholder — Circle auth is phone OTP; email reset is not active.
 * Returns success without revealing whether the email exists.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true as const });
}
