import { Container } from "@/components/layout/Container";

export function LandingValueProp() {
  return (
    <section
      aria-labelledby="landing-value-heading"
      className="bg-[#f3f3f3] pb-6 pt-10 sm:pb-8 sm:pt-14 lg:pb-10 lg:pt-16"
    >
      <Container className="max-w-[980px]">
        <p
          id="landing-value-heading"
          className="mx-auto max-w-[18ch] text-center text-[2.5rem] font-medium leading-[0.9] tracking-[-0.02em] text-[#101010] sm:max-w-[24ch] sm:text-[2.8rem] md:max-w-[26ch] md:text-[3rem]"
        >
          Join curated, real-world meetups hosted by verified creators, founders,
          and <em className="font-display text-brand italic">community leaders</em>
          . No fake profiles. No awkward crowds. Just the{" "}
          <em className="font-display text-brand italic">right people</em>.
        </p>
      </Container>
    </section>
  );
}
