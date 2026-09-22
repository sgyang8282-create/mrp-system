import { MonthlyPlansPageClient } from "@/components/monthly-plans/monthly-plans-page-client";
import { currentPlanMonth, getMonthlyPlanData } from "@/lib/services/monthly-plans";

export const revalidate = 0;

export default async function MonthlyPlansPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const planMonth = searchParams.month ?? currentPlanMonth();
  const data = await getMonthlyPlanData(planMonth);
  return <MonthlyPlansPageClient data={data} />;
}
