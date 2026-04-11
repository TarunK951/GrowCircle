import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { HostWizard } from "./wizard";

export default function HostAMeetPage() {
  return (
    <Container className="page-shell">
      <MarketingPageIntro
        eyebrow="Host"
        title="Host a meet"
        description="Walk through a lightweight host wizard. Data is stored in browser state only — perfect for demos and stakeholder reviews."
      />
      <HostWizard />
    </Container>
  );
}
