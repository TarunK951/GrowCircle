import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { ExploreFilters } from "@/components/discover/ExploreFilters";
import { EventCard } from "@/components/events/EventCard";
import { listEvents } from "@/lib/mockApi";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";
import { Reveal } from "@/components/providers/Reveal";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const sp = await searchParams;
  const allForMeta = await listEvents();
  const events = await listEvents({
    cityId: sp.city || undefined,
    category: sp.category,
    dateFrom: sp.dateFrom || undefined,
    dateTo: sp.dateTo || undefined,
  });
  const cities = citiesData as City[];
  const categories = Array.from(new Set(allForMeta.map((e) => e.category)));
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));
  const cityOptions = cities.map((c) => ({ id: c.id, name: c.name }));

  return (
    <Container className="page-shell">
      <Reveal>
        <MarketingPageIntro eyebrow="Explore" title="Discover meets" />
      </Reveal>

      <ExploreFilters
        key={[
          sp.city ?? "",
          sp.category ?? "all",
          sp.dateFrom ?? "",
          sp.dateTo ?? "",
        ].join("|")}
        initialCity={sp.city ?? ""}
        initialCategory={sp.category ?? "all"}
        initialDateFrom={sp.dateFrom ?? ""}
        initialDateTo={sp.dateTo ?? ""}
        cities={cityOptions}
        categories={categories}
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Reveal key={e.id}>
            <EventCard event={e} cityName={cityById[e.cityId] ?? ""} />
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
