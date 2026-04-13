/**
 * Sends a plain-text email with the sign-in code. Uses Resend when `RESEND_API_KEY` is set.
 */

export async function sendOtpEmail(params: {
  to: string;
  code: string;
  purpose: "login" | "signup";
}): Promise<{ sent: boolean; devLogged: boolean }> {
  const { to, code, purpose } = params;
  const subject =
    purpose === "signup"
      ? "Your ConnectSphere sign-up code"
      : "Your ConnectSphere sign-in code";
  const text = `Your one-time code is: ${code}\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.\n`;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "ConnectSphere <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      `[sendOtpEmail] RESEND_API_KEY not set — OTP for ${to}: ${code}`,
    );
    return { sent: false, devLogged: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[sendOtpEmail] Resend error", res.status, errText);
    console.warn(`[sendOtpEmail] Fallback log OTP for ${to}: ${code}`);
    return { sent: false, devLogged: true };
  }

  return { sent: true, devLogged: false };
}
