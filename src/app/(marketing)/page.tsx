import { RegionalMeetsSection } from "@/components/discover/RegionalMeetsSection";
import { Container } from "@/components/layout/Container";
import { LandingBentoGallery } from "@/components/marketing/LandingBentoGallery";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingStats } from "@/components/marketing/LandingStats";
import { LandingValueProp } from "@/components/marketing/LandingValueProp";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";

const cityOptions = (citiesData as City[]).map((c) => ({
  id: c.id,
  name: c.name,
}));

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <LandingValueProp />
      <LandingStats />
      <LandingBentoGallery />

      <section className="border-t border-black/6 bg-[#f7f7f7] pb-16 pt-10 sm:pb-20 sm:pt-12">
        <Container className="max-w-6xl px-4 sm:px-6 lg:px-8">
          <RegionalMeetsSection
            cities={cityOptions}
            className="mt-0 shadow-md"
            eyebrow="Upcoming"
            title="Events near you"
            askForMetroOnMount={false}
          />
        </Container>
      </section>
    </>
  );
}
