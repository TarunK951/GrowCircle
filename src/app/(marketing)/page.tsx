import { LandingBentoGallery } from "@/components/marketing/LandingBentoGallery";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingStats } from "@/components/marketing/LandingStats";
import { LandingValueProp } from "@/components/marketing/LandingValueProp";

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <LandingValueProp />
      <LandingStats />
      <LandingBentoGallery />
    </>
  );
}
