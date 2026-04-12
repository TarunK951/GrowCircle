import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";

export default function FaqsPage() {
  return (
    <Container className="page-shell">
      <MarketingPageIntro
        eyebrow="Help"
        title="FAQs"
        description="Frequently asked questions will be published here."
      />
      <div className="mt-10 rounded-2xl border border-neutral-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="font-onest text-base font-semibold text-neutral-900">
          FAQ content is being prepared.
        </p>
        <p className="mt-2 text-sm text-neutral-800">
          For urgent questions, please use the contact page.
        </p>
      </div>
    </Container>
  );
}
