import { z } from "zod";

/** Username / display name for Circle: letters and digits only (no symbols or spaces). */
export const circleUsernameSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters")
  .max(30, "Keep it under 30 characters")
  .regex(/^[a-zA-Z0-9]+$/, "Only letters and numbers are allowed");
