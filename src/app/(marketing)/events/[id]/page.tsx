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
    <Container className="page-shell !pt-4 !pb-10 sm:!pt-5 sm:!pb-12 md:!pt-6 md:!pb-14">
      <EventDetailView id={id} />
    </Container>
  );
}
