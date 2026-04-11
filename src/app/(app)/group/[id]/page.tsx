import { GroupPageView } from "../GroupPageView";

type GroupPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default function GroupPage(props: GroupPageProps) {
  return <GroupPageView params={props.params} />;
}
