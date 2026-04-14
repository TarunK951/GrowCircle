import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { ExploreFilters } from "@/components/discover/ExploreFilters";
import { RegionalMeetsSection } from "@/components/discover/RegionalMeetsSection";
import { DiscoverEventGrid } from "@/components/discover/DiscoverEventGrid";
import { EVENT_CATEGORY_PRESETS } from "@/lib/eventCategories";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";
import { Reveal } from "@/components/providers/Reveal";

type DiscoverPageProps = Readonly<{
  searchParams: Promise<{
    city?: string;
    category?: string;
    /** YYYY-MM-DD */
    date?: string;
    search?: string;
  }>;
}>;

export default async function DiscoverPage(props: DiscoverPageProps) {
  const sp = await props.searchParams;
  const cities = citiesData as City[];
  const categories = [...EVENT_CATEGORY_PRESETS];
  const cityOptions = cities.map((c) => ({ id: c.id, name: c.name }));

  return (
    <Container className="page-shell">
      <Reveal>
        <MarketingPageIntro
          className="max-w-3xl"
          eyebrow="Explore"
          title="Discover meets"
          description="Search by keyword, pick a city from monument icon tiles, and filter by interest and date. On smaller screens, open Filters for the full panel."
        />
      </Reveal>

      <ExploreFilters
        key={[
          sp.city ?? "",
          sp.category ?? "all",
          sp.date ?? "",
          sp.search ?? "",
        ].join("|")}
        initialCity={sp.city ?? ""}
        initialCategory={sp.category ?? "all"}
        initialDate={sp.date ?? ""}
        initialSearch={sp.search ?? ""}
        cities={cityOptions}
        categories={categories}
      />

      <RegionalMeetsSection cities={cityOptions} />

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
