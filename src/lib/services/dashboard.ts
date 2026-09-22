import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  CapaLoadItem,
  DashboardData,
  ShortageRiskItem,
  TopPlanItem,
} from "@/types/dashboard";
import { getDemoDashboardData } from "@/lib/services/dashboard.demo";

/**
 * 대시보드에 필요한 KPI/차트/리스트 데이터를 한 번에 조회한다.
 * - Supabase 환경변수가 없거나(로컬 프리뷰) 조회 중 오류가 나면 데모 데이터로 대체하여
 *   화면이 항상 정상적으로 렌더링되도록 한다 (isDemoData 플래그로 배너 표시).
 */
export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    return getDemoDashboardData();
  }

  try {
    const supabase = createServerSupabaseClient();
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    // 1) 최신 MRP 실행(run) 조회 → CAPA 결과 기준
    const { data: latestRun } = await supabase
      .from("mrp_runs")
      .select("id, plan_month")
      .order("executed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2) CAPA 부하율
    let capaLoads: CapaLoadItem[] = [];
    let capaOverGroupCount = 0;
    if (latestRun) {
      const { data: capaRows } = await supabase
        .from("capa_results")
        .select("available_minutes, required_minutes, load_pct, production_groups(group_name)")
        .eq("run_id", latestRun.id);

      capaLoads = (capaRows ?? []).map((row: any) => ({
        groupName: row.production_groups?.group_name ?? "미지정",
        availableMinutes: row.available_minutes,
        requiredMinutes: row.required_minutes,
        loadPct: row.load_pct,
      }));
      capaOverGroupCount = capaLoads.filter((c) => c.loadPct > 100).length;
    }

    // 3) 이번 달 생산계획 TOP 10
    const { data: planRows } = await supabase
      .from("monthly_plans")
      .select("plan_qty, items(item_code, item_name)")
      .eq("plan_month", monthStart)
      .order("plan_qty", { ascending: false })
      .limit(10);

    const topPlans: TopPlanItem[] = (planRows ?? []).map((row: any) => ({
      itemCode: row.items?.item_code ?? "-",
      itemName: row.items?.item_name ?? "-",
      planQty: row.plan_qty,
    }));

    // 4) 재고 시뮬레이션 기반 결품위험/재고부족
    const { data: simRows } = await supabase
      .from("inventory_simulation_daily")
      .select("sim_date, expected_qty, alert_level, items(item_code, item_name)")
      .in("alert_level", ["WARNING", "CRITICAL"])
      .gte("sim_date", today.toISOString().slice(0, 10))
      .order("sim_date", { ascending: true })
      .limit(50);

    const oneDayMs = 1000 * 60 * 60 * 24;
    const shortageRisks: ShortageRiskItem[] = (simRows ?? [])
      .slice(0, 10)
      .map((row: any) => ({
        itemCode: row.items?.item_code ?? "-",
        itemName: row.items?.item_name ?? "-",
        expectedQty: row.expected_qty,
        daysUntilShortage: Math.max(
          0,
          Math.round((new Date(row.sim_date).getTime() - today.getTime()) / oneDayMs)
        ),
        alertLevel: row.alert_level,
      }));

    const lowStockCount = (simRows ?? []).filter((r: any) => r.alert_level === "CRITICAL").length;
    const shortageRiskCount = (simRows ?? []).filter((r: any) => r.alert_level === "WARNING").length;

    // 5) 계획 대비 실적(달성률) - 이번 달 뷰 집계
    const { data: pvaRows } = await supabase
      .from("v_plan_vs_actual")
      .select("planned_qty, actual_qty")
      .gte("plan_date", monthStart);

    const totalPlanned = (pvaRows ?? []).reduce((sum: number, r: any) => sum + (r.planned_qty ?? 0), 0);
    const totalActual = (pvaRows ?? []).reduce((sum: number, r: any) => sum + (r.actual_qty ?? 0), 0);
    const achievementRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 1000) / 10 : 0;

    return {
      kpis: {
        achievementRate,
        shortageRiskCount,
        lowStockCount,
        capaOverGroupCount,
        lastUpdatedAt: new Date().toISOString(),
      },
      capaLoads,
      topPlans,
      shortageRisks,
      isDemoData: false,
    };
  } catch (error) {
    console.error("[getDashboardData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoDashboardData();
  }
}
