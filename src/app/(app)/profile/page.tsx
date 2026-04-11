"use client";

import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { ProfileAccountLinks } from "@/components/profile/ProfileAccountLinks";
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
    <div className="mx-auto max-w-2xl text-neutral-900">
      <div className="border-b border-neutral-200 pb-8">
        <h1 className="font-onest text-3xl font-semibold tracking-tight text-neutral-900">
          Profile
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-800">
          Update how you appear to hosts and guests. Email is read-only in this
          demo.
        </p>
      </div>

      <div className="mt-8">
        <ProfileAccountLinks />
      </div>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-3 sm:w-40">
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-neutral-200 bg-neutral-100 shadow-sm">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-500">
                {(user?.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              user?.verified
                ? "bg-emerald-100 text-emerald-900"
                : "bg-neutral-200 text-neutral-800"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {user?.verified ? "Verified" : "Not verified"}
          </div>
          {!user?.verified && (
            <Link
              href="/verify-profile"
              className="text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Verify profile
            </Link>
          )}
        </div>

        <form
          className="min-w-0 flex-1 space-y-6 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 sm:p-8"
          onSubmit={handleSubmit(async (data) => {
            updateProfile({ name: data.name });
            toast.success("Profile updated");
          })}
        >
          <div>
            <label
              htmlFor="profile-name"
              className="text-sm font-semibold text-neutral-900"
            >
              Display name
            </label>
            <input
              id="profile-name"
              className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-2 text-xs font-medium text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Email</p>
            <p className="mt-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800">
              {user?.email ?? "—"}
            </p>
            <p className="mt-2 text-xs text-neutral-700">
              Contact support to change email (not available in the demo).
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            Save changes
          </button>
        </form>
      </div>
    </div>
  );
}
