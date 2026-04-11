import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { HostWizard } from "./wizard";

export default function HostAMeetPage() {
  return (
    <Container className="page-shell">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <MarketingPageIntro
          align="center"
          eyebrow="Host"
          title="Host a meet"
          description="Walk through a lightweight host wizard. Data is stored in browser state only — perfect for demos and stakeholder reviews."
        />
        <HostWizard />
      </div>
    </Container>
  );
}
