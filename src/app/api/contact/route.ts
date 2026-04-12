import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

/**
 * Contact form — handled on the server. Wire this to email/CRM when available.
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
      { error: "Invalid fields.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true as const });
}
