import Link from "next/link";
import { MapPin } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

export default function LocationsPage() {
  const cities = citiesData as City[];

  return (
    <Container className="py-12 sm:py-16">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
          Locations
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Cities where ConnectSphere is live
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Pick a city to browse meets and filters—we&apos;ll show what&apos;s happening near you.
        </p>
      </Reveal>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <li key={c.id}>
            <Reveal>
              <Link
                href={`/explore?city=${encodeURIComponent(c.id)}`}
                className="flex items-center gap-3 rounded-[var(--radius-section)] border border-primary/10 bg-white/70 px-5 py-4 shadow-sm transition hover:border-primary/25 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-semibold text-foreground">{c.name}</span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </Container>
  );
}
