import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoActualsData } from "@/lib/services/actuals.demo";
import type { ActualItemOption, ActualRow, ActualsData } from "@/types/actual";

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getActualsData(actualDate: string): Promise<ActualsData> {
  if (!isSupabaseConfigured()) {
    return getDemoActualsData(actualDate);
  }

  try {
    const supabase = createServerSupabaseClient();

    const [{ data: actualRows, error: actualError }, { data: itemRows, error: itemError }] = await Promise.all([
      supabase
        .from("production_actuals")
        .select("id, actual_date, qty, defect_qty, input_type, created_at, items(id, item_code, item_name)")
        .eq("actual_date", actualDate)
        .order("created_at", { ascending: false }),
      supabase.from("items").select("id, item_code, item_name").eq("is_active", true).order("item_code"),
    ]);

    if (actualError || itemError) throw actualError ?? itemError;

    const actuals: ActualRow[] = (actualRows ?? []).map((r: any) => ({
      id: r.id,
      actualDate: r.actual_date,
      itemId: r.items?.id,
      itemCode: r.items?.item_code ?? "-",
      itemName: r.items?.item_name ?? "-",
      qty: r.qty,
      defectQty: r.defect_qty,
      inputType: r.input_type,
      createdAt: r.created_at,
    }));

    const items: ActualItemOption[] = (itemRows ?? []).map((r: any) => ({
      id: r.id,
      itemCode: r.item_code,
      itemName: r.item_name,
    }));

    return { actualDate, actuals, items, isDemoData: false };
  } catch (error) {
    console.error("[getActualsData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoActualsData(actualDate);
  }
}
