import { use } from "react";
import { Container } from "@/components/layout/Container";
import { EventDetailView } from "@/components/events/EventDetailView";

type EventPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

/**
 * `use(params)` unwraps the params Promise (required in Next.js 16+).
 * If DevTools logs "params are being enumerated", it is often the inspector
 * serializing props—not a bug in this page.
 */
export default function EventDetailPage({ params }: EventPageProps) {
  const { id } = use(params);
  return (
    <Container className="page-shell !pt-4 !pb-10 sm:!pt-5 sm:!pb-12 md:!pt-6 md:!pb-14">
      <EventDetailView id={id} />
    </Container>
  );
}
