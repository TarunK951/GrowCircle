import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import type { CareersValue } from "@/lib/types";

export function CareersValues({
  sectionTitle,
  heading,
  values,
}: {
  sectionTitle: string;
  heading: string;
  values: CareersValue[];
}) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {sectionTitle}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {heading}
          </h2>
        </Reveal>
        <div className="mt-12 space-y-10">
          {values.map((v) => (
            <Reveal key={v.id}>
              <div className="rounded-2xl border border-primary/10 bg-white/40 p-6 backdrop-blur-sm sm:p-8">
                <h3 className="text-lg font-semibold text-primary">{v.title}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                  {v.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
