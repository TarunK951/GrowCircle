import { PrimaryButton } from "@/components/ui/MarketingButton";
import { Reveal } from "@/components/providers/Reveal";
import type { CareersContent } from "@/lib/types";

export function CareersHero({
  hero,
}: {
  hero: CareersContent["hero"];
}) {
  return (
    <section className="relative overflow-hidden border-b border-primary/10 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,59,189,0.1),transparent_55%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
            {hero.eyebrow}
          </p>
          <h1 className="font-onest mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {hero.lead}
          </p>
          <div className="mt-10">
            <PrimaryButton
              href="/careers#open-positions"
              label={hero.ctaLabel}
              className="!min-w-[200px]"
            />
          </div>
          <p className="mt-6 text-sm text-muted">
            Prefer email?{" "}
            <a
              href="mailto:careers@connectsphere.app"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              careers@connectsphere.app
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
