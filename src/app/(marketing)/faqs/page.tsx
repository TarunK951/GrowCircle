import { Container } from "@/components/layout/Container";

const faqs = [
  {
    q: "Is this a real product?",
    a: "This repository is a Next.js prototype with mock data and client-side session state.",
  },
  {
    q: "Can I actually attend meets?",
    a: "No — bookings are simulated in your browser for UX testing.",
  },
  {
    q: "How do I verify my profile?",
    a: "Sign in, open Verify in the app shell, and complete the mock steps.",
  },
];

export default function FaqsPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight">FAQs</h1>
      <div className="mt-10 space-y-6">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-2xl border border-primary/10 bg-white/50 p-5">
            <p className="font-semibold text-foreground">{f.q}</p>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
