"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { signupMock } from "@/lib/mockApi";
import { useSessionStore } from "@/stores/session-store";
import { GoogleGlyph } from "@/components/auth/GoogleGlyph";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

type Form = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:ring-2 focus:ring-neutral-950/10";

export function SignupForm() {
  const router = useRouter();
  const login = useSessionStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
        Create account
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Join ConnectSphere — create a profile and start exploring meets.
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={handleSubmit(async (data) => {
          const user = await signupMock(data);
          login(user);
          toast.success("Welcome to ConnectSphere");
          router.push("/onboarding");
        })}
      >
        <div>
          <label
            htmlFor="signup-name"
            className="text-sm font-medium text-neutral-700"
          >
            Name
          </label>
          <input
            id="signup-name"
            autoComplete="name"
            placeholder="Enter your name"
            className={`mt-2 ${inputClass}`}
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="text-sm font-medium text-neutral-700"
          >
            Email
          </label>
          <input
            id="signup-email"
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
            htmlFor="signup-password"
            className="text-sm font-medium text-neutral-700"
          >
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-neutral-950 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-900 disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Sign up"}
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
          toast.message("Google sign-up is not connected in this demo.")
        }
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
      >
        <GoogleGlyph className="h-5 w-5 shrink-0" />
        Continue with Google
      </button>

      <p className="mt-10 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
        >
          Log in here
        </Link>
      </p>
    </div>
  );
}
