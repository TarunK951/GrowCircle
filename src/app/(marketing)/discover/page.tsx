import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { ExploreFilters } from "@/components/discover/ExploreFilters";
import { DiscoverEventGrid } from "@/components/discover/DiscoverEventGrid";
import { getStaticEvents } from "@/lib/eventsCatalog";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";
import { Reveal } from "@/components/providers/Reveal";

type DiscoverPageProps = Readonly<{
  searchParams: Promise<{
    city?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}>;

export default async function DiscoverPage(props: DiscoverPageProps) {
  const sp = await props.searchParams;
  const cities = citiesData as City[];
  const categories = Array.from(
    new Set(getStaticEvents().map((e) => e.category)),
  );
  const cityOptions = cities.map((c) => ({ id: c.id, name: c.name }));

  return (
    <Container className="page-shell">
      <Reveal>
        <MarketingPageIntro
          className="max-w-3xl"
          eyebrow="Explore"
          title="Discover meets"
          description="Browse circles by city, interest, and date. Narrow the list with the filters below, then open a meet to learn more."
        />
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

      <Suspense
        fallback={
          <p className="mt-10 text-sm text-muted">Loading meets…</p>
        }
      >
        <DiscoverEventGrid />
      </Suspense>
    </Container>
  );
}
