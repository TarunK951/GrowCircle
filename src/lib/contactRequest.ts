export async function submitContactForm(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: true }> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not send message");
  }
  return (await res.json()) as { ok: true };
}

export async function submitForgotPasswordRequest(
  email: string,
): Promise<{ ok: true }> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Request failed");
  }
  return (await res.json()) as { ok: true };
}
