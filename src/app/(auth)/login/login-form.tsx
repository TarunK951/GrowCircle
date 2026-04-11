"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  return (
    <div className="rounded-2xl border border-primary/10 bg-white/60 p-8 shadow-sm backdrop-blur-md">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-muted">
        Try <code className="rounded bg-primary/5 px-1">alex@example.com</code>{" "}
        or any email — mock auth accepts all passwords with 4+ characters.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (data) => {
          const user = await loginMock(data.email, data.password);
          login(user);
          toast.success("Signed in");
          router.push(returnUrl);
        })}
      >
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : "Continue"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-primary">
          Sign up
        </Link>
        {" · "}
        <Link href="/forgot-password" className="text-primary">
          Forgot password
        </Link>
      </p>
    </div>
  );
}
