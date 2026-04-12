import { Container } from "@/components/layout/Container";

export function LandingValueProp() {
  return (
    <section
      aria-labelledby="landing-value-heading"
      className="bg-white py-16 sm:py-20 lg:py-24"
    >
      <Container>
        <p
          id="landing-value-heading"
          className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-foreground sm:text-xl"
        >
          Join curated, real-world meetups hosted by verified creators, founders,
          and{" "}
          <em className="font-display text-brand italic">community leaders</em>.
          No fake profiles. No awkward crowds. Just the{" "}
          <em className="font-display text-brand italic">right people</em>.
        </p>
      </Container>
    </section>
  );
}
