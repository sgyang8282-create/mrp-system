import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  computeCapaLoads,
  computeNetRequirements,
  explodeRequirements,
  type BomEdge,
  type CapaGroupMeta,
  type CapaItemMeta,
} from "@/lib/mrp/engine";
import { getDemoMrpPageData, getDemoMrpRuns, getDemoCapaLoads } from "@/lib/services/mrp.demo";
import type { MrpPageData, MrpResultLineRow, MrpRunSummary } from "@/types/mrp";
import type { CapaLoadItem } from "@/types/dashboard";

export interface RunMrpResult {
  ok: boolean;
  error?: string;
  runId?: string;
  shortageItemCount?: number;
  capaOverGroupCount?: number;
}

/**
 * 05_아키텍처 4.1절 파이프라인의 2)~3)단계를 수행한다.
 * 1) 대상 월 CONFIRMED 계획 조회 → 2) BOM 전개 → 3) 현재고 반영 순소요량 계산
 * → mrp_runs/mrp_result_lines 저장 → 4) CAPA 집계 → capa_results 저장.
 */
export async function runMrp(planMonth: string): Promise<RunMrpResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "데모 모드에서는 MRP를 실행할 수 없습니다. Supabase 연결 정보를 설정해 주세요." };
  }

  const supabase = createServerSupabaseClient();

  const { data: planRows, error: planError } = await supabase
    .from("monthly_plans")
    .select("item_id, plan_qty")
    .eq("plan_month", planMonth)
    .eq("status", "CONFIRMED");

  if (planError) return { ok: false, error: planError.message };
  if (!planRows || planRows.length === 0) {
    return { ok: false, error: "확정(CONFIRMED)된 월간 생산계획이 없습니다. 먼저 계획을 확정해 주세요." };
  }

  const [{ data: itemRows, error: itemError }, { data: bomRows, error: bomError }, { data: invRows, error: invError }, { data: groupRows, error: groupError }] =
    await Promise.all([
      supabase.from("items").select("id, item_code, item_name, item_type, production_group_id, work_time_min"),
      supabase.from("bom_lines").select("parent_item_id, child_item_id, quantity_per"),
      supabase.from("inventory").select("item_id, quantity"),
      supabase.from("production_groups").select("id, group_name, available_minutes"),
    ]);

  if (itemError || bomError || invError || groupError) {
    return { ok: false, error: (itemError ?? bomError ?? invError ?? groupError)!.message };
  }

  const bomEdges: BomEdge[] = (bomRows ?? []).map((r: any) => ({
    parentItemId: r.parent_item_id,
    childItemId: r.child_item_id,
    quantityPer: r.quantity_per,
  }));

  const inventoryByItem = new Map<string, number>((invRows ?? []).map((r: any) => [r.item_id, r.quantity]));

  const gross = explodeRequirements(
    planRows.map((r: any) => ({ itemId: r.item_id, qty: r.plan_qty })),
    bomEdges
  );
  const net = computeNetRequirements(gross, inventoryByItem);

  // 1) mrp_runs 생성
  const { data: runRow, error: runInsertError } = await supabase
    .from("mrp_runs")
    .insert({ plan_month: planMonth, status: "RUNNING" })
    .select("id")
    .single();

  if (runInsertError || !runRow) {
    return { ok: false, error: runInsertError?.message ?? "MRP 실행(run) 생성에 실패했습니다." };
  }
  const runId = runRow.id as string;

  // 2) mrp_result_lines 저장
  const itemById = new Map((itemRows ?? []).map((r: any) => [r.id, r]));
  const resultLineRows = net.map((line) => ({
    run_id: runId,
    item_id: line.itemId,
    parent_item_id: null, // 표시용 상세 부모는 필요 시 확장 (현재는 레벨만 저장)
    bom_level: line.bomLevel,
    gross_requirement: line.grossRequirement,
    on_hand_qty: line.onHandQty,
    net_requirement: line.netRequirement,
  }));

  const { error: lineInsertError } = await supabase.from("mrp_result_lines").insert(resultLineRows);
  if (lineInsertError) {
    await supabase.from("mrp_runs").update({ status: "FAILED" }).eq("id", runId);
    return { ok: false, error: lineInsertError.message };
  }

  // 3) CAPA 집계 및 저장
  const itemMetaById = new Map<string, CapaItemMeta>(
    (itemRows ?? []).map((r: any) => [
      r.id,
      { itemId: r.id, productionGroupId: r.production_group_id, workTimeMin: r.work_time_min ?? 0 },
    ])
  );
  const groupMetas: CapaGroupMeta[] = (groupRows ?? []).map((g: any) => ({
    id: g.id,
    groupName: g.group_name,
    availableMinutes: g.available_minutes,
  }));

  const capaLoads = computeCapaLoads(net, itemMetaById, groupMetas);
  const capaRows = capaLoads.map((c) => ({
    run_id: runId,
    production_group_id: c.groupId,
    available_minutes: c.availableMinutes,
    required_minutes: c.requiredMinutes,
  }));

  if (capaRows.length > 0) {
    const { error: capaInsertError } = await supabase.from("capa_results").insert(capaRows);
    if (capaInsertError) {
      await supabase.from("mrp_runs").update({ status: "FAILED" }).eq("id", runId);
      return { ok: false, error: capaInsertError.message };
    }
  }

  await supabase.from("mrp_runs").update({ status: "COMPLETED" }).eq("id", runId);

  return {
    ok: true,
    runId,
    shortageItemCount: net.filter((l) => l.netRequirement > 0).length,
    capaOverGroupCount: capaLoads.filter((c) => c.loadPct > 100).length,
  };
}

export async function getMrpRuns(planMonth?: string): Promise<MrpRunSummary[]> {
  if (!isSupabaseConfigured()) return getDemoMrpRuns();

  try {
    const supabase = createServerSupabaseClient();
    let query = supabase
      .from("mrp_runs")
      .select("id, plan_month, status, executed_at")
      .order("executed_at", { ascending: false })
      .limit(20);
    if (planMonth) query = query.eq("plan_month", planMonth);

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      planMonth: r.plan_month,
      status: r.status,
      executedAt: r.executed_at,
    }));
  } catch (error) {
    console.error("[getMrpRuns] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoMrpRuns();
  }
}

export async function getMrpPageData(requestedRunId?: string | null): Promise<MrpPageData> {
  if (!isSupabaseConfigured()) return getDemoMrpPageData();

  try {
    const runs = await getMrpRuns();
    const selectedRunId = requestedRunId ?? runs[0]?.id ?? null;
    if (!selectedRunId) {
      return { runs, selectedRunId: null, results: [], isDemoData: false };
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mrp_result_lines")
      .select(
        "id, bom_level, gross_requirement, on_hand_qty, net_requirement, items!mrp_result_lines_item_id_fkey(id, item_code, item_name, item_type)"
      )
      .eq("run_id", selectedRunId)
      .order("bom_level", { ascending: true });

    if (error) throw error;

    const results: MrpResultLineRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      itemId: r.items?.id,
      itemCode: r.items?.item_code ?? "-",
      itemName: r.items?.item_name ?? "-",
      itemType: r.items?.item_type ?? "PART",
      bomLevel: r.bom_level,
      grossRequirement: r.gross_requirement,
      onHandQty: r.on_hand_qty,
      netRequirement: r.net_requirement,
    }));

    return { runs, selectedRunId, results, isDemoData: false };
  } catch (error) {
    console.error("[getMrpPageData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoMrpPageData();
  }
}

export async function getCapaLoadsForRun(requestedRunId?: string | null): Promise<{
  runs: MrpRunSummary[];
  selectedRunId: string | null;
  loads: CapaLoadItem[];
  isDemoData: boolean;
}> {
  if (!isSupabaseConfigured()) {
    const runs = getDemoMrpRuns();
    return { runs, selectedRunId: runs[0]?.id ?? null, loads: getDemoCapaLoads(), isDemoData: true };
  }

  try {
    const runs = await getMrpRuns();
    const selectedRunId = requestedRunId ?? runs[0]?.id ?? null;
    if (!selectedRunId) return { runs, selectedRunId: null, loads: [], isDemoData: false };

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("capa_results")
      .select("available_minutes, required_minutes, load_pct, production_groups(group_name)")
      .eq("run_id", selectedRunId);

    if (error) throw error;

    const loads: CapaLoadItem[] = (data ?? []).map((r: any) => ({
      groupName: r.production_groups?.group_name ?? "미지정",
      availableMinutes: r.available_minutes,
      requiredMinutes: r.required_minutes,
      loadPct: r.load_pct,
    }));

    return { runs, selectedRunId, loads, isDemoData: false };
  } catch (error) {
    console.error("[getCapaLoadsForRun] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    const runs = getDemoMrpRuns();
    return { runs, selectedRunId: runs[0]?.id ?? null, loads: getDemoCapaLoads(), isDemoData: true };
  }
}
