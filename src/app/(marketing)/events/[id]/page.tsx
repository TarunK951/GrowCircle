import { Container } from "@/components/layout/Container";
import { EventDetailView } from "@/components/events/EventDetailView";

type EventPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

/** `await params` — required for Next.js 16+ dynamic route props (Promise). */
export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  return (
    <Container className="page-shell !pt-4 !pb-10 sm:!pt-5 sm:!pb-12 md:!pt-6 md:!pb-14">
      <EventDetailView id={id} />
    </Container>
  );
}
