import { Container } from "@/components/layout/Container";
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
    <Container className="py-16">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
        <p className="mt-3 max-w-2xl text-muted">
          ConnectSphere is a frontend prototype: every step is wired to JSON and
          browser state — swap in a real API when you are ready.
        </p>
      </Reveal>
      <ol className="mt-12 space-y-8">
        {steps.map((s, i) => (
          <Reveal key={s.title}>
            <li className="flex gap-6 rounded-2xl border border-primary/10 bg-white/50 p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <p className="mt-2 text-muted">{s.body}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </Container>
  );
}
