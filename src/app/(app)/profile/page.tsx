"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/session-store";

const schema = z.object({
  name: z.string().min(2),
});

type Form = z.infer<typeof schema>;

export default function ProfilePage() {
  const user = useSessionStore((s) => s.user);
  const updateProfile = useSessionStore((s) => s.updateProfile);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-muted">
        Verified: {user?.verified ? "yes" : "no"} —{" "}
        <Link href="/verify-profile" className="text-primary">
          verify profile
        </Link>
      </p>
      <form
        className="mt-8 space-y-4 rounded-2xl border border-primary/10 bg-white/50 p-6"
        onSubmit={handleSubmit(async (data) => {
          updateProfile({ name: data.name });
          toast.success("Profile updated");
        })}
      >
        <div>
          <label className="text-sm font-medium">Display name</label>
          <input
            className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
        <p className="text-sm text-muted">Email: {user?.email}</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Save
        </button>
      </form>
    </div>
  );
}
