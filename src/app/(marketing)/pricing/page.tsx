import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { Reveal } from "@/components/providers/Reveal";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    blurb: "Discover meets, save favourites, and chat with mock threads.",
  },
  {
    name: "Host",
    price: "$12",
    blurb: "Publish recurring meets, priority placement in discover (mock).",
  },
  {
    name: "Circle",
    price: "$29",
    blurb: "Matchmaking-style suggestions + verification badge (mock).",
  },
];

export default function PricingPage() {
  return (
    <Container className="page-shell">
      <Reveal>
        <MarketingPageIntro
          eyebrow="Plans"
          title="Pricing"
          description="Placeholder tiers for the prototype — no payments are processed."
        />
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <Reveal key={t.name}>
            <div className="liquid-glass-surface liquid-glass-interactive flex h-full flex-col">
              <p className="text-sm font-semibold text-primary">{t.name}</p>
              <p className="mt-2 font-onest text-3xl font-semibold text-foreground">
                {t.price}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                {t.blurb}
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92"
              >
                Get started
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
