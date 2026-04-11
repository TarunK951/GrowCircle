"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { GoogleGlyph } from "@/components/auth/GoogleGlyph";
import { loginMock } from "@/lib/mockApi";
import { useSessionStore } from "@/stores/session-store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

type Form = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const login = useSessionStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const signupHref =
    returnUrl && returnUrl !== "/dashboard"
      ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}`
      : "/signup";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Log in
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Welcome back! Please enter your email and password.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit(async (data) => {
          try {
            const user = await loginMock(data.email, data.password);
            login(user);
            toast.success("Signed in");
            router.push(returnUrl);
          } catch {
            toast.error("Something went wrong. Please try again.");
          }
        })}
      >
        <div>
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-neutral-700"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className="mt-2 w-full rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-950/10"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-neutral-700"
          >
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 pr-11 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-950/10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-200/60 hover:text-neutral-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label
            htmlFor="login-remember"
            className="flex cursor-pointer select-none items-center gap-2 text-neutral-600"
          >
            <input
              id="login-remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-950/15"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="shrink-0 text-neutral-600 underline-offset-2 transition hover:text-neutral-950 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Login"}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-canvas px-3 text-neutral-400">
            Or Continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          toast.message("Google sign-in is not connected in this demo.")
        }
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
      >
        <GoogleGlyph className="h-5 w-5 shrink-0" />
        Continue with Google
      </button>

      <p className="mt-10 text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
          <Link
            href={signupHref}
            className="font-semibold text-brand underline decoration-brand/35 underline-offset-[3px] transition hover:decoration-brand"
          >
            Sign up here
          </Link>
      </p>
    </div>
  );
}
