import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoPvaData } from "@/lib/services/plan-vs-actual.demo";
import type { PvaData, PvaDailyTotal, PvaRow } from "@/types/plan-vs-actual";

export function defaultDateRange(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

export async function getPvaData(dateFrom: string, dateTo: string): Promise<PvaData> {
  if (!isSupabaseConfigured()) {
    return getDemoPvaData(dateFrom, dateTo);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("v_plan_vs_actual")
      .select("plan_date, item_id, item_code, item_name, group_name, planned_qty, actual_qty, actual_defect_qty, achievement_pct")
      .gte("plan_date", dateFrom)
      .lte("plan_date", dateTo)
      .order("plan_date", { ascending: true });

    if (error) throw error;

    const rows: PvaRow[] = (data ?? []).map((r: any) => ({
      planDate: r.plan_date,
      itemId: r.item_id,
      itemCode: r.item_code,
      itemName: r.item_name,
      groupName: r.group_name,
      plannedQty: r.planned_qty,
      actualQty: r.actual_qty,
      actualDefectQty: r.actual_defect_qty,
      achievementPct: r.achievement_pct,
    }));

    const totalsByDate = new Map<string, PvaDailyTotal>();
    for (const row of rows) {
      const existing = totalsByDate.get(row.planDate) ?? { date: row.planDate, plannedQty: 0, actualQty: 0 };
      existing.plannedQty += row.plannedQty;
      existing.actualQty += row.actualQty;
      totalsByDate.set(row.planDate, existing);
    }

    return {
      dateFrom,
      dateTo,
      rows,
      dailyTotals: Array.from(totalsByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
      isDemoData: false,
    };
  } catch (error) {
    console.error("[getPvaData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoPvaData(dateFrom, dateTo);
  }
}
