import Link from "next/link";
import { Container } from "@/components/layout/Container";
import GlassyButton from "@/components/ui/GlassyButton";
import LiquidGlass from "@/components/ui/LiquidGlass";
import { LiquidGlassDock } from "@/components/ui/LiquidGlassDock";
import { EventCard } from "@/components/events/EventCard";
import { Reveal } from "@/components/providers/Reveal";
import { listEvents } from "@/lib/mockApi";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

export default async function HomePage() {
  const events = await listEvents();
  const featured = events.slice(0, 3);
  const cities = citiesData as City[];
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  return (
    <>
      <section className="relative overflow-hidden border-b border-primary/10 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,59,189,0.12),transparent_55%)]" />
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                ConnectSphere
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Curated meets. Real chemistry. Calm, glassy UI.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted">
                Discover events near you, host a circle, and verify your profile
                — all running on mock data so every flow is clickable.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="h-12 w-[160px]">
                  <GlassyButton label="Browse meets" link="/discover" />
                </div>
                <div className="h-12 w-[160px]">
                  <GlassyButton
                    label="Host a meet"
                    link="/host-a-meet"
                    background="#1E3BBD55"
                    hoverBackground="#1E3BBD77"
                  />
                </div>
              </div>
              <p className="mt-6 text-sm text-muted">
                Inspired by discovery platforms like{" "}
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href="https://playace.co/?city=0"
                  target="_blank"
                  rel="noreferrer"
                >
                  Playace
                </a>{" "}
                and{" "}
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href="https://timeleft.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Timeleft
                </a>{" "}
                — original design, not a clone.
              </p>
            </Reveal>
            <div className="relative h-[320px] w-full sm:h-[380px]">
              <div className="absolute inset-0 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/25 via-canvas to-primary/10">
                <LiquidGlass
                  settings={{ mode: "preset", radius: 36 }}
                  className="h-full w-full"
                />
              </div>
              <div className="relative z-10 flex h-full flex-col justify-end p-6">
                <p className="text-sm font-medium text-primary">Liquid glass</p>
                <p className="mt-1 max-w-sm text-sm text-foreground/90">
                  SVG displacement + frost — ported for the browser without the
                  Framer runtime.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight">
              David UI–style dock
            </h2>
            <p className="mt-2 max-w-2xl text-muted">
              Tailwind glass panel with highlights — sits on a photographic
              backdrop so the blur reads clearly.
            </p>
          </Reveal>
          <div className="mt-8 flex justify-center">
            <LiquidGlassDock />
          </div>
        </Container>
      </section>

      <section className="border-t border-primary/10 py-16">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Featured meets
              </h2>
              <p className="mt-2 text-muted">
                Pulled from JSON fixtures — join flow writes a mock booking.
              </p>
            </div>
            <Link
              href="/discover"
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
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
