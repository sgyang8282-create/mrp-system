import { SimulationPageClient } from "@/components/simulation/simulation-page-client";
import { getSimulationData, getSimulationItems } from "@/lib/services/simulation";

export const revalidate = 0;

export default async function SimulationPage({
  searchParams,
}: {
  searchParams: { itemId?: string; days?: string };
}) {
  const days = Number(searchParams.days ?? 14) || 14;
  const items = await getSimulationItems();
  const itemId = searchParams.itemId ?? items[0]?.id ?? null;
  const data = await getSimulationData(itemId, days);

  return <SimulationPageClient data={data} days={days} />;
}
