import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Coffee,
  MapPin,
  PartyPopper,
  Quote,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/MarketingButton";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import type { HomeContent } from "@/lib/home";
import type { City } from "@/lib/types";
import { cn } from "@/lib/utils";

const eventTypeIcon: Record<string, LucideIcon> = {
  dinner: UtensilsCrossed,
  coffee: Coffee,
  active: Activity,
  social: PartyPopper,
};

export function HomeSocialProof({
  items,
}: {
  items: HomeContent["socialProof"];
}) {
  return (
    <div className="border-y border-primary/10 bg-white/40 backdrop-blur-md">
      <Container>
        <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-3 sm:gap-8">
          {items.map((item) => (
            <div
              key={item.label}
              className="text-center sm:border-r sm:border-primary/10 sm:last:border-r-0 sm:last:pr-0"
            >
              <p className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm font-medium text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}

export function HomeHowItWorks({
  data,
}: {
  data: HomeContent["howItWorks"];
}) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Flow
          </p>
          <h2 className="font-onest mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {data.title}
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">{data.subtitle}</p>
        </Reveal>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.steps.map((step) => (
            <Reveal key={step.n}>
              <li className="relative h-full rounded-[var(--radius-section)] border border-primary/10 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition hover:border-primary/20 hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {step.n}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <Reveal>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Full walkthrough
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary"
            >
              Set up your profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function HomeEventTypes({
  data,
}: {
  data: HomeContent["eventTypes"];
}) {
  return (
    <section className="border-t border-primary/10 bg-linear-to-b from-white/30 to-transparent py-16 sm:py-20">
      <Container>
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Formats
          </p>
          <h2 className="font-onest mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {data.title}
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">{data.subtitle}</p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {data.types.map((t) => {
            const Icon = eventTypeIcon[t.id] ?? UtensilsCrossed;
            return (
              <Reveal key={t.id}>
                <Link
                  href={t.href}
                  className="group flex h-full flex-col rounded-[var(--radius-section)] border border-primary/10 bg-canvas/90 p-6 shadow-sm transition hover:border-primary/25 hover:bg-white/80 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                        {t.label}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {t.description}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Browse
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function HomeCities({ cities }: { cities: City[] }) {
  const featured = cities.slice(0, 6);
  return (
    <section className="border-t border-primary/10 py-16 sm:py-20">
      <Container>
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Cities
          </p>
          <h2 className="font-onest mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Where we&apos;re live
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            Jump into discovery with a city filter—more regions are opening every season.
          </p>
        </Reveal>
        <div className="mt-10 flex flex-wrap gap-3">
          {featured.map((c) => (
            <Reveal key={c.id}>
              <Link
                href={`/explore?city=${encodeURIComponent(c.id)}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm",
                  "transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
                )}
              >
                <MapPin className="h-4 w-4 text-primary" aria-hidden />
                {c.name}
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <Link
            href="/locations"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Explore all locations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}

export function HomeTestimonials({
  data,
}: {
  data: HomeContent["testimonials"];
}) {
  return (
    <section className="border-t border-primary/10 bg-white/25 py-16 sm:py-20">
      <Container>
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            Stories
          </p>
          <h2 className="font-onest mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {data.title}
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">{data.subtitle}</p>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {data.quotes.map((q) => (
            <Reveal key={q.id}>
              <blockquote className="relative h-full rounded-[var(--radius-section)] border border-primary/10 bg-canvas/95 p-6 shadow-sm">
                <Quote
                  className="absolute right-5 top-5 h-8 w-8 text-primary/15"
                  aria-hidden
                />
                <p className="relative text-sm leading-relaxed text-foreground">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <footer className="mt-6 border-t border-primary/10 pt-4">
                  <p className="font-semibold text-foreground">{q.name}</p>
                  <p className="text-sm text-muted">{q.detail}</p>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function HomeClosingCta({
  data,
}: {
  data: HomeContent["closingCta"];
}) {
  return (
    <section className="border-t border-primary/10 py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[var(--radius-section)] border border-primary/15 bg-linear-to-br from-primary/12 via-canvas to-primary/5 px-8 py-12 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <Reveal>
              <h2 className="font-onest text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {data.title}
              </h2>
              <p className="mt-3 text-lg text-muted">{data.body}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <PrimaryButton href={data.primaryHref} label={data.primaryLabel} />
                <SecondaryButton
                  href={data.secondaryHref}
                  label={data.secondaryLabel}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
