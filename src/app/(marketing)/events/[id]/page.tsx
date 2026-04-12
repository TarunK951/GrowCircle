import { use } from "react";
import { Container } from "@/components/layout/Container";
import { EventDetailView } from "@/components/events/EventDetailView";

type EventPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

/** `use(params)` avoids sync enumeration of the params Promise (Next.js 16). */
export default function EventDetailPage({ params }: EventPageProps) {
  const { id } = use(params);
  return (
    <Container className="page-shell">
      <EventDetailView id={id} />
    </Container>
  );
}
