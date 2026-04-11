import { Container } from "@/components/layout/Container";
import { EventDetailView } from "@/components/events/EventDetailView";

type EventPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function EventDetailPage(props: EventPageProps) {
  const { id } = await props.params;
  return (
    <Container className="page-shell">
      <EventDetailView id={id} />
    </Container>
  );
}
