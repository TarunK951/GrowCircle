import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";

export default function TermsPage() {
  return (
    <Container className="page-shell max-w-3xl">
      <MarketingPageIntro
        eyebrow="Legal"
        title="Terms of service"
        description="This ConnectSphere build is a demonstration prototype. No real services are offered, and no contractual relationship is formed by using the mock flows."
      />
      <div className="mt-12 space-y-6 text-base leading-relaxed text-muted">
        <h2 className="font-onest text-xl font-semibold text-foreground">
          Use
        </h2>
        <p>
          You may navigate the prototype for evaluation purposes. Do not enter
          sensitive personal data — persistence is limited to this browser.
        </p>
      </div>
    </Container>
  );
}
