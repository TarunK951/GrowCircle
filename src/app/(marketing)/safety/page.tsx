import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";

export default function SafetyPage() {
  return (
    <Container className="page-shell">
      <MarketingPageIntro
        eyebrow="Trust"
        title="Trust & safety"
        description="In a production social discovery product, you would publish community guidelines, reporting flows, and moderation SLAs. This prototype focuses on UI and client-side flows only — treat all meets as fictional."
      />
    </Container>
  );
}
