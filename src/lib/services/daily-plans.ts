import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateDailySchedule, type GroupMeta, type ItemProductionMeta, type NetRequirementInput } from "@/lib/mrp/daily-plan-engine";
import { getDemoDailyPlanData, getDemoDailyPlanDateRange } from "@/lib/services/daily-plans.demo";
import type { DailyPlanData, DailyPlanRow, GenerateDailyPlanResult } from "@/types/daily-plan";

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyPlanData(planDate: string): Promise<DailyPlanData> {
  if (!isSupabaseConfigured()) {
    return getDemoDailyPlanData(planDate);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("daily_plans")
      .select(
        `id, plan_date, planned_qty, planned_minutes, inspection_start_date, inspection_end_date, status, source,
         items!daily_plans_item_id_fkey(id, item_code, item_name),
         production_groups(id, group_name)`
      )
      .eq("plan_date", planDate)
      .order("plan_date");

    if (error) throw error;

    const plans: DailyPlanRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      planDate: r.plan_date,
      itemId: r.items?.id,
      itemCode: r.items?.item_code ?? "-",
      itemName: r.items?.item_name ?? "-",
      productionGroupId: r.production_groups?.id,
      groupName: r.production_groups?.group_name ?? "-",
      plannedQty: r.planned_qty,
      plannedMinutes: r.planned_minutes,
      inspectionStartDate: r.inspection_start_date,
      inspectionEndDate: r.inspection_end_date,
      status: r.status,
      source: r.source,
    }));

    return { planDate, plans, isDemoData: false };
  } catch (error) {
    console.error("[getDailyPlanData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoDailyPlanData(planDate);
  }
}

export async function getDailyPlanDateRange(): Promise<{ minDate: string; maxDate: string }> {
  if (!isSupabaseConfigured()) return getDemoDailyPlanDateRange();

  try {
    const supabase = createServerSupabaseClient();
    const [{ data: minRow }, { data: maxRow }] = await Promise.all([
      supabase.from("daily_plans").select("plan_date").order("plan_date", { ascending: true }).limit(1).maybeSingle(),
      supabase.from("daily_plans").select("plan_date").order("plan_date", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const today = todayIso();
    return { minDate: minRow?.plan_date ?? today, maxDate: maxRow?.plan_date ?? today };
  } catch {
    return { minDate: todayIso(), maxDate: todayIso() };
  }
}

/**
 * MRP 실행(run) 결과를 바탕으로 일일 생산계획을 자동 생성한다.
 * 기존에 자동 생성되어 아직 확정되지 않은(DRAFT, AUTO) 계획은 재계산을 위해 먼저 제거한다.
 * 수동으로 조정했거나(MANUAL) 확정/잠금된 계획은 건드리지 않는다.
 */
export async function generateDailyPlansFromRun(runId: string, startDate: string): Promise<GenerateDailyPlanResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "데모 모드에서는 일일계획을 생성할 수 없습니다. Supabase 연결 정보를 설정해 주세요." };
  }

  const supabase = createServerSupabaseClient();

  const { data: resultLines, error: resultError } = await supabase
    .from("mrp_result_lines")
    .select("item_id, bom_level, net_requirement, items!mrp_result_lines_item_id_fkey(id, item_code, item_name, item_type)")
    .eq("run_id", runId);

  if (resultError) return { ok: false, error: resultError.message };
  if (!resultLines || resultLines.length === 0) {
    return { ok: false, error: "선택한 MRP 실행 결과가 없습니다." };
  }

  const [{ data: itemRows, error: itemError }, { data: groupRows, error: groupError }] = await Promise.all([
    supabase.from("items").select("id, production_group_id, work_time_min"),
    supabase.from("production_groups").select("id, headcount"),
  ]);
  if (itemError || groupError) return { ok: false, error: (itemError ?? groupError)!.message };

  const netLines: NetRequirementInput[] = resultLines.map((r: any) => ({
    itemId: r.item_id,
    itemCode: r.items?.item_code ?? "-",
    itemName: r.items?.item_name ?? "-",
    itemType: r.items?.item_type ?? "PART",
    bomLevel: r.bom_level,
    netRequirement: r.net_requirement,
  }));

  const itemMetaById = new Map<string, ItemProductionMeta>(
    (itemRows ?? []).map((r: any) => [r.id, { productionGroupId: r.production_group_id, workTimeMin: r.work_time_min ?? 0 }])
  );
  const groups: GroupMeta[] = (groupRows ?? []).map((g: any) => ({ id: g.id, headcount: g.headcount }));

  const { rows, unschedulable, daySpan } = generateDailySchedule(netLines, itemMetaById, groups, startDate);

  if (rows.length === 0) {
    return {
      ok: false,
      error: "생성할 수 있는 일일계획이 없습니다 (부족 수량이 없거나 모두 배정 불가 품목입니다).",
      unassignableItems: unschedulable.map((u) => ({
        itemCode: u.itemCode,
        itemName: u.itemName,
        netRequirement: u.netRequirement,
        reason: u.reason,
      })),
    };
  }

  // 기존 자동 생성분(DRAFT, AUTO) 중 이번 생성 범위와 겹치는 것을 정리한다.
  const { error: deleteError } = await supabase
    .from("daily_plans")
    .delete()
    .eq("status", "DRAFT")
    .eq("source", "AUTO")
    .gte("plan_date", startDate);
  if (deleteError) return { ok: false, error: deleteError.message };

  const insertRows = rows.map((r) => ({
    plan_date: r.planDate,
    item_id: r.itemId,
    production_group_id: r.productionGroupId,
    planned_qty: r.plannedQty,
    planned_minutes: r.plannedMinutes,
    inspection_start_date: r.inspectionStartDate,
    inspection_end_date: r.inspectionEndDate,
    status: "DRAFT",
    source: "AUTO",
    run_id: runId,
  }));

  const { error: insertError } = await supabase.from("daily_plans").insert(insertRows);
  if (insertError) return { ok: false, error: insertError.message };

  return {
    ok: true,
    createdCount: insertRows.length,
    daySpan,
    unassignableItems: unschedulable.map((u) => ({
      itemCode: u.itemCode,
      itemName: u.itemName,
      netRequirement: u.netRequirement,
      reason: u.reason,
    })),
  };
}
