import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import type { CareersTestimonial } from "@/lib/types";

export function CareersQuotes({
  testimonials,
}: {
  testimonials: CareersTestimonial[];
}) {
  return (
    <section className="border-t border-primary/10 bg-white/30 py-16 sm:py-20">
      <Container>
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Words from our team
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            A few voices from the people building ConnectSphere with you in mind.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Reveal key={t.id}>
              <blockquote className="flex h-full flex-col rounded-2xl border border-primary/10 bg-canvas/80 p-6 shadow-sm backdrop-blur-sm">
                <p className="flex-1 text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-6 border-t border-primary/10 pt-4">
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted">{t.role}</p>
                  <p className="text-xs text-muted/90">{t.location}</p>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
