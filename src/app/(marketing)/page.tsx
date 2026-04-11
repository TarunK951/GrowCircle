import Link from "next/link";
import { CalendarHeart, Compass, ShieldCheck } from "lucide-react";
import {
  HomeCities,
  HomeClosingCta,
  HomeEventTypes,
  HomeHowItWorks,
  HomeSocialProof,
  HomeTestimonials,
} from "@/components/marketing/HomeLandingSections";
import { Container } from "@/components/layout/Container";
import { PrimaryButton, SecondaryButton } from "@/components/ui/MarketingButton";
import { EventCard } from "@/components/events/EventCard";
import { Reveal } from "@/components/providers/Reveal";
import { getHomeContent } from "@/lib/home";
import { hostNameForUserId } from "@/lib/hostName";
import { listEvents } from "@/lib/mockApi";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

const valueCards = [
  {
    title: "Discover nearby",
    body: "Browse curated circles by city, interest, and date—see what fits your week before you commit.",
    icon: Compass,
  },
  {
    title: "Host in minutes",
    body: "Set capacity, time, and place with a guided flow so your first meet feels effortless.",
    icon: CalendarHeart,
  },
  {
    title: "Trust, built in",
    body: "Verification and clear host expectations help everyone show up ready to connect.",
    icon: ShieldCheck,
  },
];

export default async function HomePage() {
  const home = getHomeContent();
  const events = await listEvents();
  const featured = events.slice(0, 3);
  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  return (
    <>
      <section className="relative overflow-hidden border-b border-primary/10 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,59,189,0.08),transparent_55%)]" />
        <Container>
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
                ConnectSphere
              </p>
              <h1 className="font-onest mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-tight">
                Meet new people in your city—calm discovery, real meetups.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted">
                Browse events near you, host your own circle, and keep everything
                organized in one clear, friendly flow.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <PrimaryButton href="/explore" label="Browse meets" />
                <SecondaryButton href="/host" label="Host a meet" />
              </div>
              <p className="mt-6 text-sm text-muted">
                New to ConnectSphere?{" "}
                <Link
                  href="/how-it-works"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  See how it works
                </Link>{" "}
                or{" "}
                <Link
                  href="/join"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  join a meet
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <HomeSocialProof items={home.socialProof} />

      <HomeHowItWorks data={home.howItWorks} />

      <HomeEventTypes data={home.eventTypes} />

      <section className="section-shell">
        <Container>
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
              Why us
            </p>
            <h2 className="font-onest mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Why ConnectSphere
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">
              Everything you need to go from curious to booked—without the clutter.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {valueCards.map(({ title, body, icon: Icon }) => (
              <Reveal key={title}>
                <div className="h-full rounded-[var(--radius-section)] border border-primary/10 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition hover:border-primary/20 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <HomeCities cities={cities} />

      <HomeTestimonials data={home.testimonials} />

      <section className="border-t border-primary/10 py-16 sm:py-20">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
                Featured
              </p>
              <h2 className="font-onest mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Featured meets
              </h2>
              <p className="mt-3 max-w-2xl text-lg text-muted">
                A snapshot of what&apos;s happening—open an event for full details and
                to save your spot.
              </p>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((e) => (
              <Reveal key={e.id}>
                <EventCard
                  event={e}
                  cityName={cityById[e.cityId] ?? "City"}
                  hostName={hostNameForUserId(e.hostUserId)}
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <HomeClosingCta data={home.closingCta} />
    </>
  );
}
