import type { User } from "@/lib/types";

/** App-local accounts (`/api/auth/login`) — not the Circle backend. */
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
