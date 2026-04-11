import Link from "next/link";
import { Container } from "@/components/layout/Container";
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
    <Container className="py-16">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Placeholder tiers for the prototype — no payments are processed.
        </p>
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <Reveal key={t.name}>
            <div className="flex h-full flex-col rounded-2xl border border-primary/10 bg-white/50 p-6">
              <p className="text-sm font-semibold text-primary">{t.name}</p>
              <p className="mt-2 text-3xl font-semibold">{t.price}</p>
              <p className="mt-4 flex-1 text-sm text-muted">{t.blurb}</p>
              <Link
                href="/signup"
                className="mt-6 inline-flex justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
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
