"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { GoogleGlyph } from "@/components/auth/GoogleGlyph";
import { loginMock, signupMock } from "@/lib/mockApi";
import { useSessionStore } from "@/stores/session-store";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

const inputClass =
  "w-full rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-950/10";

/**
 * Single form for /login and /signup — layout + hero live in auth layout; only fields swap.
 */
export function UnifiedAuthForm() {
  const pathname = usePathname();
  const mode = pathname === "/signup" ? "signup" : "login";
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const loginSession = useSessionStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);

  const resolver = useMemo(
    () => zodResolver(mode === "login" ? loginSchema : signupSchema),
    [mode],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues & Partial<SignupValues>>({
    resolver,
    defaultValues: { email: "", password: "", name: "" },
  });

  useEffect(() => {
    reset({ email: "", password: "", name: "" });
  }, [mode, reset]);

  const otherHref = useMemo(() => {
    const q =
      returnUrl && returnUrl !== "/dashboard"
        ? `?returnUrl=${encodeURIComponent(returnUrl)}`
        : "";
    return mode === "login" ? `/signup${q}` : `/login${q}`;
  }, [mode, returnUrl]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (mode === "login") {
        const d = data as LoginValues;
        const user = await loginMock(d.email, d.password);
        loginSession(user);
        toast.success("Signed in");
        router.push(returnUrl);
        return;
      }
      const d = data as SignupValues;
      const user = await signupMock(d);
      loginSession(user);
      toast.success("Welcome to ConnectSphere");
      router.push("/onboarding");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      {mode === "login" ? (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Log in
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Welcome back! Please enter your email and password.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
            Create account
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Join ConnectSphere — create a profile and start exploring meets.
          </p>
        </>
      )}

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        {mode === "signup" && (
          <div>
            <label
              htmlFor="auth-name"
              className="text-sm font-medium text-neutral-700"
            >
              Name
            </label>
            <input
              id="auth-name"
              autoComplete="name"
              placeholder="Enter your name"
              className={`mt-2 ${inputClass}`}
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="auth-email"
            className="text-sm font-medium text-neutral-700"
          >
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            className={`mt-2 ${inputClass}`}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="text-sm font-medium text-neutral-700"
          >
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder="Enter your password"
              className={`${inputClass} pr-11`}
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

        {mode === "login" && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <label
              htmlFor="auth-remember"
              className="flex cursor-pointer select-none items-center gap-2 text-neutral-600"
            >
              <input
                id="auth-remember"
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
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
        >
          {isSubmitting
            ? mode === "login"
              ? "Signing in…"
              : "Creating…"
            : mode === "login"
              ? "Login"
              : "Sign up"}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-canvas px-3 text-neutral-400">Or Continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          toast.message(
            mode === "login"
              ? "Google sign-in is not connected in this demo."
              : "Google sign-up is not connected in this demo.",
          )
        }
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
      >
        <GoogleGlyph className="h-5 w-5 shrink-0" />
        Continue with Google
      </button>

      <p className="mt-10 text-center text-sm text-neutral-500">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href={otherHref}
              className="font-semibold text-brand underline decoration-brand/35 underline-offset-[3px] transition hover:decoration-brand"
            >
              Sign up here
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={otherHref}
              className="font-semibold text-brand underline decoration-brand/35 underline-offset-[3px] transition hover:decoration-brand"
            >
              Log in here
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
