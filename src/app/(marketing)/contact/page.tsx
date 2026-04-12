"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { submitContactForm } from "@/lib/contactRequest";

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
    <Container className="page-shell">
      <MarketingPageIntro
        eyebrow="Hello"
        title="Contact"
        description="Sends to the mock API — you will see a success toast."
      />
      <form
        className="liquid-glass-surface mt-10 max-w-lg space-y-5"
        onSubmit={handleSubmit(async (data) => {
          try {
            await submitContactForm(data);
            toast.success("Message sent.");
            reset();
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Could not send message.",
            );
          }
        })}
      >
        <div>
          <label className="text-sm font-medium text-foreground">Name</label>
          <input className="liquid-glass-input mt-2" {...register("name")} />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            className="liquid-glass-input mt-2"
            type="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Message</label>
          <textarea
            className="liquid-glass-input mt-2 min-h-[120px] resize-y"
            {...register("message")}
          />
          {errors.message && (
            <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92 disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send"}
        </button>
      </form>
    </Container>
  );
}
