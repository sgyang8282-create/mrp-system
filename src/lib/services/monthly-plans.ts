import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoMonthlyPlanData } from "@/lib/services/monthly-plans.demo";
import type { FinishedItemOption, MonthlyPlanData, MonthlyPlanRow } from "@/types/mrp";

export function currentPlanMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export async function getMonthlyPlanData(planMonth: string): Promise<MonthlyPlanData> {
  if (!isSupabaseConfigured()) {
    return getDemoMonthlyPlanData(planMonth);
  }

  try {
    const supabase = createServerSupabaseClient();

    const [{ data: planRows, error: planError }, { data: itemRows, error: itemError }, { data: runRows }] =
      await Promise.all([
        supabase
          .from("monthly_plans")
          .select("id, plan_qty, status, items(id, item_code, item_name)")
          .eq("plan_month", planMonth)
          .order("plan_qty", { ascending: false }),
        supabase
          .from("items")
          .select("id, item_code, item_name")
          .eq("item_type", "FINISHED")
          .eq("is_active", true)
          .order("item_code"),
        supabase
          .from("mrp_runs")
          .select("id")
          .eq("plan_month", planMonth)
          .order("executed_at", { ascending: false })
          .limit(1),
      ]);

    if (planError || itemError) throw planError ?? itemError;

    const plans: MonthlyPlanRow[] = (planRows ?? []).map((r: any) => ({
      id: r.id,
      itemId: r.items?.id,
      itemCode: r.items?.item_code ?? "-",
      itemName: r.items?.item_name ?? "-",
      planQty: r.plan_qty,
      status: r.status,
    }));

    const finishedItems: FinishedItemOption[] = (itemRows ?? []).map((r: any) => ({
      id: r.id,
      itemCode: r.item_code,
      itemName: r.item_name,
    }));

    return {
      planMonth,
      plans,
      finishedItems,
      latestRunId: runRows?.[0]?.id ?? null,
      isDemoData: false,
    };
  } catch (error) {
    console.error("[getMonthlyPlanData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoMonthlyPlanData(planMonth);
  }
}
