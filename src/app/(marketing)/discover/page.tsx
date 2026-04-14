import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { ExploreFilters } from "@/components/discover/ExploreFilters";
import { RegionalMeetsSection } from "@/components/discover/RegionalMeetsSection";
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
          description="Search by keyword, then open Filters for city, category, and date — same compact panel on every screen size."
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

      <RegionalMeetsSection
        cities={cityOptions}
        exploreFilters={{
          city: sp.city ?? "",
          search: sp.search ?? "",
          category: sp.category ?? "all",
          date: sp.date ?? "",
        }}
      />
    </Container>
  );
}
