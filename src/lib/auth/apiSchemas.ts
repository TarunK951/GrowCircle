import { z } from "zod";

/** Trim + lowercase so `User@Mail.com` matches stored `user@mail.com`. */
export const normalizedEmailSchema = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.string().email(),
);

export const loginBodySchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(4),
});

export const registerBodySchema = z.object({
  name: z.string().min(2),
  email: normalizedEmailSchema,
  password: z.string().min(6),
});
