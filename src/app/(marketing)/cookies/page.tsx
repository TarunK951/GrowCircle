import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";

export default function CookiesPage() {
  return (
    <Container className="page-shell max-w-3xl">
      <MarketingPageIntro
        eyebrow="Legal"
        title="Cookies"
        description="This demo may rely on browser storage for mock authentication and preferences. No third-party marketing cookies are included in the scaffold."
      />
    </Container>
  );
}
