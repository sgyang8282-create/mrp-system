import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { simulateInventory, type DailyInputs } from "@/lib/mrp/simulation-engine";
import { getDemoSimulationData } from "@/lib/services/simulation.demo";
import type { SimulationData, SimulationItemOption } from "@/types/simulation";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoPlusDays(base: string, n: number): string {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function getSimulationItems(): Promise<SimulationItemOption[]> {
  if (!isSupabaseConfigured()) {
    return getDemoSimulationData("FG-A", 1).items;
  }
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .select("id, item_code, item_name")
      .eq("is_active", true)
      .order("item_code");
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ id: r.id, itemCode: r.item_code, itemName: r.item_name }));
  } catch {
    return getDemoSimulationData("FG-A", 1).items;
  }
}

export async function getSimulationData(itemId: string | null, days: number): Promise<SimulationData> {
  if (!isSupabaseConfigured() || !itemId) {
    return getDemoSimulationData(itemId ?? "FG-A", days);
  }

  try {
    const supabase = createServerSupabaseClient();
    const startDate = todayIso();
    const endDate = isoPlusDays(startDate, days - 1);

    const [{ data: itemRow, error: itemError }, { data: invRow }, { data: bomRows }, items] = await Promise.all([
      supabase.from("items").select("id, item_code, item_name").eq("id", itemId).single(),
      supabase.from("inventory").select("quantity").eq("item_id", itemId).maybeSingle(),
      supabase.from("bom_lines").select("parent_item_id, quantity_per").eq("child_item_id", itemId),
      getSimulationItems(),
    ]);

    if (itemError || !itemRow) throw itemError ?? new Error("품목을 찾을 수 없습니다.");

    const currentQty = invRow?.quantity ?? 0;
    const parentIds = (bomRows ?? []).map((r: any) => r.parent_item_id);
    const qtyPerByParent = new Map((bomRows ?? []).map((r: any) => [r.parent_item_id, r.quantity_per]));

    const [{ data: ownPlans }, { data: parentPlans }, { data: adjustments }, { data: actuals }] = await Promise.all([
      supabase
        .from("daily_plans")
        .select("plan_date, planned_qty")
        .eq("item_id", itemId)
        .gte("plan_date", startDate)
        .lte("plan_date", endDate),
      parentIds.length > 0
        ? supabase
            .from("daily_plans")
            .select("plan_date, planned_qty, item_id")
            .in("item_id", parentIds)
            .gte("plan_date", startDate)
            .lte("plan_date", endDate)
        : Promise.resolve({ data: [] as any[] }),
      supabase
        .from("inventory_adjustments")
        .select("created_at, adjustment_type, qty")
        .eq("item_id", itemId)
        .in("adjustment_type", ["SHIPMENT_OUT", "DISPOSAL"])
        .gte("created_at", `${startDate}T00:00:00Z`)
        .lte("created_at", `${endDate}T23:59:59Z`),
      supabase
        .from("production_actuals")
        .select("actual_date, defect_qty")
        .eq("item_id", itemId)
        .gte("actual_date", startDate)
        .lte("actual_date", endDate),
    ]);

    const productionByDate = new Map<string, number>();
    for (const r of ownPlans ?? []) productionByDate.set(r.plan_date, (productionByDate.get(r.plan_date) ?? 0) + r.planned_qty);

    const requirementByDate = new Map<string, number>();
    for (const r of parentPlans ?? []) {
      const qtyPer = qtyPerByParent.get(r.item_id) ?? 0;
      requirementByDate.set(r.plan_date, (requirementByDate.get(r.plan_date) ?? 0) + r.planned_qty * qtyPer);
    }

    const shipmentByDate = new Map<string, number>();
    for (const r of adjustments ?? []) {
      const date = String(r.created_at).slice(0, 10);
      shipmentByDate.set(date, (shipmentByDate.get(date) ?? 0) + Math.abs(r.qty));
    }

    const defectByDate = new Map<string, number>();
    for (const r of actuals ?? []) {
      defectByDate.set(r.actual_date, (defectByDate.get(r.actual_date) ?? 0) + (r.defect_qty ?? 0));
    }

    const inputs: DailyInputs[] = Array.from({ length: days }, (_, i) => {
      const date = isoPlusDays(startDate, i);
      return {
        date,
        productionQty: productionByDate.get(date) ?? 0,
        requirementQty: requirementByDate.get(date) ?? 0,
        shipmentQty: shipmentByDate.get(date) ?? 0,
        defectQty: defectByDate.get(date) ?? 0,
      };
    });

    const simulated = simulateInventory(currentQty, inputs);

    return {
      itemId: itemRow.id,
      itemCode: itemRow.item_code,
      itemName: itemRow.item_name,
      currentQty,
      days: simulated,
      items,
      isDemoData: false,
    };
  } catch (error) {
    console.error("[getSimulationData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoSimulationData(itemId, days);
  }
}
