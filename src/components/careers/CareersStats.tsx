import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import type { CareersStat } from "@/lib/types";

export function CareersStats({
  title,
  stats,
}: {
  title: string;
  stats: CareersStat[];
}) {
  return (
    <section className="border-t border-primary/10 py-16 sm:py-20">
      <Container>
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <Reveal key={s.id}>
              <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] to-transparent p-6 text-center sm:p-8">
                <p className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">{s.label}</p>
                <p className="mt-1 text-xs text-muted">{s.hint}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
