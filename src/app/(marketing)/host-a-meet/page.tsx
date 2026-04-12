import { Container } from "@/components/layout/Container";
import { MarketingPageIntro } from "@/components/layout/MarketingPageIntro";
import { HostMeetCircleBanner } from "@/components/host/HostMeetCircleBanner";
import { HostWizard } from "./wizard";

export default function HostAMeetPage() {
  return (
    <Container className="page-shell pt-4! pb-12! sm:pt-5! sm:pb-14! md:pt-6! md:pb-16!">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
        <MarketingPageIntro
          align="center"
          eyebrow="Host"
          title="Host a meet"
          description="Walk through the host wizard. Your progress is saved in this browser (local storage) so you can continue after sign-in or refresh. Sign in with Circle to publish."
        />
        <HostMeetCircleBanner />
        <HostWizard />
      </div>
    </Container>
  );
}
