import { use } from "react";
import { GroupPageView } from "../GroupPageView";

type GroupPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

/** See `events/[id]/page.tsx` — `use(params)` is required; DevTools may still warn when inspecting. */
export default function GroupPage({ params }: GroupPageProps) {
  const { id } = use(params);
  return <GroupPageView id={id} />;
}
