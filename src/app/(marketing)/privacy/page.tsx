import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";

export default function PrivacyPage() {
  return (
    <Container className="page-shell max-w-3xl">
      <MarketingPageIntro
        eyebrow="Legal"
        title="Privacy policy"
        description="Session state and form submissions in this prototype stay in your browser unless you deploy a backend. There is no analytics or tracking configured in this repository by default."
      />
    </Container>
  );
}
