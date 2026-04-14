import { RegionalMeetsSection } from "@/components/discover/RegionalMeetsSection";
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

      <RegionalMeetsSection
        cities={cityOptions}
        eyebrow="Upcoming"
        title="Events near you"
        askForMetroOnMount={false}
        viewAllEventsHref="/explore"
        hideWhenEmpty
        homePageSurface
      />
    </>
  );
}
