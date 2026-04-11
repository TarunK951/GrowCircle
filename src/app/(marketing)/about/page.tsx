import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";

export default function AboutPage() {
  return (
    <Container className="page-shell">
      <MarketingPageIntro
        eyebrow="Company"
        title="About ConnectSphere"
        description="We are building a calm, glass-forward social discovery experience: city meets, host tools, and verification — inspired by products like Playace and Timeleft, with an original interface and mock data for rapid iteration."
      />
    </Container>
  );
}
