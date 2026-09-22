import { GroupsPageClient } from "@/components/groups/groups-page-client";
import { getGroupsData } from "@/lib/services/groups";

export const revalidate = 0;

export default async function GroupsPage() {
  const data = await getGroupsData();
  return <GroupsPageClient data={data} />;
}
