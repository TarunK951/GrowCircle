import { Container } from "@/components/layout/Container";
import { EventDetailView } from "@/components/events/EventDetailView";

type EventPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default function EventDetailPage(props: EventPageProps) {
  return (
    <Container className="page-shell">
      <EventDetailView params={props.params} />
    </Container>
  );
}
