import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";

export function CareersPerks({
  title,
  perks,
}: {
  title: string;
  perks: string[];
}) {
  return (
    <section className="bg-white/25 py-16 sm:py-20">
      <Container>
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        </Reveal>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {perks.map((line) => (
            <Reveal key={line}>
              <li className="flex gap-3 rounded-xl border border-primary/10 bg-canvas/90 px-4 py-3 text-sm text-foreground backdrop-blur-sm">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
