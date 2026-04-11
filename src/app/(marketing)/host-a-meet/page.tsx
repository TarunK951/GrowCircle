import { Container } from "@/components/layout/Container";
import { HostWizard } from "./wizard";

export default function HostAMeetPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Host a meet</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Walk through a lightweight host wizard. Data is stored in browser state
        only — perfect for demos and stakeholder reviews.
      </p>
      <HostWizard />
    </Container>
  );
}
