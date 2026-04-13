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

export const emailOtpPurposeSchema = z.enum(["login", "signup"]);

export const emailOtpSendBodySchema = z.object({
  email: normalizedEmailSchema,
  purpose: emailOtpPurposeSchema,
});

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code.");

export const emailOtpVerifyBodySchema = z.discriminatedUnion("purpose", [
  z.object({
    email: normalizedEmailSchema,
    purpose: z.literal("login"),
    code: otpCodeSchema,
  }),
  z.object({
    email: normalizedEmailSchema,
    purpose: z.literal("signup"),
    code: otpCodeSchema,
    name: z.string().trim().min(2, "Name is required"),
  }),
]);
