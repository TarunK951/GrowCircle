import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import type { CareersLifeItem } from "@/lib/types";

const gradientById: Record<string, string> = {
  g1: "bg-gradient-to-br from-sky-200/80 via-sky-100/50 to-primary/30",
  g2: "bg-gradient-to-br from-amber-100/90 via-orange-50/80 to-orange-200/40",
  g3: "bg-gradient-to-br from-emerald-100/80 via-teal-50/70 to-teal-200/35",
  g4: "bg-gradient-to-br from-violet-100/80 via-purple-50/60 to-primary/25",
};

export function CareersLife({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: CareersLifeItem[];
}) {
  return (
    <section className="border-t border-primary/10 py-16 sm:py-20">
      <Container>
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Reveal key={item.id}>
              <figure
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-2xl border border-primary/10 shadow-sm",
                  gradientById[item.id] ?? "bg-gradient-to-br from-primary/15 to-canvas",
                )}
              >
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent px-4 py-3">
                  <span className="text-sm font-medium text-white drop-shadow">
                    {item.label}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
