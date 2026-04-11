import { GroupPageView } from "../GroupPageView";

type GroupPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function GroupPage(props: GroupPageProps) {
  const { id } = await props.params;
  return <GroupPageView id={id} />;
}
