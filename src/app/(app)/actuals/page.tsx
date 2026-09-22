import { ActualsPageClient } from "@/components/actuals/actuals-page-client";
import { getActualsData, todayIso } from "@/lib/services/actuals";

export const revalidate = 0;

export default async function ActualsPage({ searchParams }: { searchParams: { date?: string } }) {
  const actualDate = searchParams.date ?? todayIso();
  const data = await getActualsData(actualDate);
  return <ActualsPageClient data={data} />;
}
