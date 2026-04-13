import type { User } from "@/lib/types";

/** App-local accounts — not the Circle backend. */
export async function loginWithEmailPasswordApi(
  email: string,
  password: string,
): Promise<User> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    user?: User;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Could not sign in.");
  }
  if (!data.user) throw new Error("Could not sign in.");
  return data.user;
}

export async function registerWithEmailPasswordApi(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as {
    user?: User;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Could not create account.");
  }
  if (!data.user) throw new Error("Could not create account.");
  return data.user;
}

export async function requestEmailOtpApi(
  email: string,
  purpose: "login" | "signup",
): Promise<{ devOtp?: string }> {
  const res = await fetch("/api/auth/email-otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    devOtp?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Could not send code.");
  }
  return { devOtp: data.devOtp };
}

export async function verifyEmailOtpApi(input: {
  email: string;
  purpose: "login" | "signup";
  code: string;
  name?: string;
}): Promise<User> {
  const body =
    input.purpose === "signup"
      ? {
          email: input.email,
          purpose: "signup" as const,
          code: input.code,
          name: input.name ?? "",
        }
      : {
          email: input.email,
          purpose: "login" as const,
          code: input.code,
        };
  const res = await fetch("/api/auth/email-otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    user?: User;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Could not verify code.");
  }
  if (!data.user) throw new Error("Could not verify code.");
  return data.user;
}
