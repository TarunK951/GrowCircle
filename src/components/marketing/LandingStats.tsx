import { Container } from "@/components/layout/Container";

const stats = [
  { value: "3000+", label: "members" },
  { value: "200+", label: "events" },
  { value: "500+", label: "hosts" },
] as const;

export function LandingStats() {
  return (
    <section aria-label="Community statistics" className="bg-white pb-16 sm:pb-20">
      <Container>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-semibold tracking-tight text-brand sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm font-medium lowercase text-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
