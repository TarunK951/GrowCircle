import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import type { CareersContent } from "@/lib/types";

export function CareersMission({
  mission,
}: {
  mission: CareersContent["mission"];
}) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {mission.title}
          </p>
          <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {mission.heading}
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted">
            {mission.body}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
