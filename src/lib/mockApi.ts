const delay = (ms = 280) => new Promise((r) => setTimeout(r, ms));

/** Contact form — no backend endpoint in Circle app contract; local delay only. */
export async function sendContactForm(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: true }> {
  void data;
  await delay(500);
  return { ok: true };
}

/** Forgot password — not used when Circle phone auth is enabled. */
export async function forgotPasswordMock(email: string): Promise<{ ok: true }> {
  void email;
  await delay(400);
  return { ok: true };
}
