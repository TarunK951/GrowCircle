import Link from "next/link";
import { MapPin } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { Reveal } from "@/components/providers/Reveal";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

export default function LocationsPage() {
  const cities = citiesData as City[];

  return (
    <Container className="page-shell">
      <Reveal>
        <MarketingPageIntro
          eyebrow="Locations"
          title="Cities where ConnectSphere is live"
          description="Pick a city to browse meets and filters—we&apos;ll show what&apos;s happening near you."
        />
      </Reveal>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <li key={c.id}>
            <Reveal>
              <Link
                href={`/explore?city=${encodeURIComponent(c.id)}`}
                className="liquid-glass-surface liquid-glass-interactive flex items-center gap-3 !py-4 transition"
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
