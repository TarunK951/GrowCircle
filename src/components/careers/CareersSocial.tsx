import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import type { CareersContent } from "@/lib/types";

export function CareersSocial({
  social,
}: {
  social: CareersContent["social"];
}) {
  return (
    <section className="border-t border-primary/10 py-16 sm:py-20">
      <Container>
        <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-canvas to-canvas p-8 sm:p-10">
          <Reveal>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {social.title}
            </h2>
            <p className="mt-3 max-w-2xl text-muted">{social.body}</p>
            <a
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full border border-primary/20 bg-white/60 px-5 py-2.5 text-sm font-semibold text-primary backdrop-blur-sm transition hover:bg-white/90"
            >
              {social.linkLabel}
            </a>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
