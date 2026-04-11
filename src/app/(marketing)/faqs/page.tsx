import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";

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
    <Container className="page-shell">
      <MarketingPageIntro
        eyebrow="Help"
        title="FAQs"
        description="Quick answers about this prototype."
      />
      <div className="mt-10 space-y-4">
        {faqs.map((f) => (
          <div key={f.q} className="liquid-glass-surface">
            <p className="font-semibold text-foreground">{f.q}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
