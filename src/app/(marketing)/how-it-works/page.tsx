import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { Reveal } from "@/components/providers/Reveal";

const steps = [
  {
    title: "Pick your city",
    body: "Browse curated meets filtered by place and vibe — same mental model as discovery apps you already know.",
  },
  {
    title: "Join or host",
    body: "Reserve a spot with one tap (mock booking) or publish a meet with the host wizard.",
  },
  {
    title: "Verify & chat",
    body: "Complete a lightweight verify flow, then message hosts in a local-only chat shell.",
  },
];

export default function HowItWorksPage() {
  return (
    <Container className="page-shell">
      <Reveal>
        <MarketingPageIntro
          eyebrow="Product"
          title="How it works"
          description="ConnectSphere is a frontend prototype: every step is wired to JSON and browser state — swap in a real API when you are ready."
        />
      </Reveal>
      <ol className="mt-12 space-y-5">
        {steps.map((s, i) => (
          <Reveal key={s.title}>
            <li className="liquid-glass-surface flex gap-5 sm:gap-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </Container>
  );
}
