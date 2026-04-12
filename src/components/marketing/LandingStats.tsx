import { Container } from "@/components/layout/Container";

const stats = [
  { value: "3000+", label: "members" },
  { value: "200+", label: "events" },
  { value: "500+", label: "hosts" },
] as const;

export function LandingStats() {
  return (
    <section
      aria-label="Community statistics"
      className="bg-[#f3f3f3] pb-12 pt-6 sm:pb-14 sm:pt-8"
    >
      <Container className="max-w-[980px]">
        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[2.3rem] font-semibold tracking-[-0.02em] text-brand sm:text-[3.15rem]">
                {s.value}
              </p>
              <p className="mt-0.5 text-[0.95rem] font-medium lowercase leading-none text-[#101010] sm:mt-1 sm:text-base">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
