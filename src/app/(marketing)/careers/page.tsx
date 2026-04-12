import type { Metadata } from "next";
import { CareersHero } from "@/components/careers/CareersHero";
import { CareersJobs } from "@/components/careers/CareersJobs";
import { CareersLife } from "@/components/careers/CareersLife";
import { CareersMission } from "@/components/careers/CareersMission";
import { CareersPerks } from "@/components/careers/CareersPerks";
import { CareersQuotes } from "@/components/careers/CareersQuotes";
import { CareersSocial } from "@/components/careers/CareersSocial";
import { CareersStats } from "@/components/careers/CareersStats";
import { CareersValues } from "@/components/careers/CareersValues";
import { getCareersContent } from "@/lib/careers";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join ConnectSphere—help people find real-life connection through curated meets and a calm, thoughtful product.",
};

export default async function CareersPage() {
  const c = await getCareersContent();

  return (
    <>
      <CareersHero hero={c.hero} />
      <CareersMission mission={c.mission} />
      <CareersQuotes testimonials={c.testimonials} />
      <CareersValues
        sectionTitle={c.valuesSectionTitle}
        heading={c.valuesHeading}
        values={c.values}
      />
      <CareersStats title={c.growthSectionTitle} stats={c.stats} />
      <CareersPerks title={c.perksTitle} perks={c.perks} />
      <CareersJobs title={c.openPositionsTitle} jobs={c.jobs} />
      <CareersSocial social={c.social} />
      <CareersLife
        title={c.lifeGallery.title}
        subtitle={c.lifeGallery.subtitle}
        items={c.lifeGallery.items}
      />
    </>
  );
}
