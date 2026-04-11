import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";

export default function AdminStubPage() {
  return (
    <Container className="page-shell">
      <MarketingPageIntro
        eyebrow="Internal"
        title="Admin"
        description="Optional placeholder from the blueprint. No admin tools are wired in this prototype — connect a backend and auth roles here later."
      />
    </Container>
  );
}
