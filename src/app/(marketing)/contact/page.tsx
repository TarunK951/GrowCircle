"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { sendContactForm } from "@/lib/mockApi";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

type Form = z.infer<typeof schema>;

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-3 text-muted">
        Sends to the mock API — you will see a success toast.
      </p>
      <form
        className="mt-8 max-w-lg space-y-4"
        onSubmit={handleSubmit(async (data) => {
          await sendContactForm(data);
          toast.success("Message sent (mock).");
          reset();
        })}
      >
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            className="mt-1 w-full rounded-xl border border-primary/15 bg-white/70 px-3 py-2"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-xl border border-primary/15 bg-white/70 px-3 py-2"
            type="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Message</label>
          <textarea
            className="mt-1 min-h-[120px] w-full rounded-xl border border-primary/15 bg-white/70 px-3 py-2"
            {...register("message")}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send"}
        </button>
      </form>
    </Container>
  );
}
