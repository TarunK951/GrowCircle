"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { forgotPasswordMock } from "@/lib/mockApi";

const schema = z.object({
  email: z.string().email(),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  return (
    <div className="liquid-glass-auth">
      <h1 className="font-onest text-2xl font-semibold tracking-tight text-foreground">
        Forgot password
      </h1>
      <p className="mt-2 text-sm text-muted">
        Mock flow — we will show a toast, no email is sent.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (data) => {
          await forgotPasswordMock(data.email);
          toast.success("If that email exists, you will hear from us (mock).");
        })}
      >
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="liquid-glass-input mt-2"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92 disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-primary">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
