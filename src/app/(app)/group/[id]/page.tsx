import { use } from "react";
import { GroupPageView } from "../GroupPageView";

type GroupPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default function GroupPage({ params }: GroupPageProps) {
  const { id } = use(params);
  return <GroupPageView id={id} />;
}
