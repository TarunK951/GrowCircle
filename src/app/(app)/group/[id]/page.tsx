import { GroupPageView } from "../GroupPageView";

type GroupPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

/** `await params` — same contract as `events/[id]/page.tsx`. */
export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  return <GroupPageView id={id} />;
}
