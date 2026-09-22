import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoInventoryData, getDemoInventoryHistory } from "@/lib/services/inventory.demo";
import type { InventoryData, InventoryHistoryRow, InventoryRow } from "@/types/inventory";

export async function getInventoryData(): Promise<InventoryData> {
  if (!isSupabaseConfigured()) {
    return getDemoInventoryData();
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .select("id, item_code, item_name, item_type, unit, is_active, inventory(quantity, updated_at)")
      .eq("is_active", true)
      .order("item_code");

    if (error) throw error;

    const rows: InventoryRow[] = (data ?? []).map((r: any) => ({
      itemId: r.id,
      itemCode: r.item_code,
      itemName: r.item_name,
      itemType: r.item_type,
      unit: r.unit,
      quantity: r.inventory?.quantity ?? 0,
      updatedAt: r.inventory?.updated_at ?? "",
    }));

    return { rows, isDemoData: false };
  } catch (error) {
    console.error("[getInventoryData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoInventoryData();
  }
}

export async function getInventoryHistory(itemId: string): Promise<InventoryHistoryRow[]> {
  if (!isSupabaseConfigured()) {
    return getDemoInventoryHistory(itemId);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("inventory_history")
      .select("id, before_qty, after_qty, change_qty, reason, changed_at")
      .eq("item_id", itemId)
      .order("changed_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      beforeQty: r.before_qty,
      afterQty: r.after_qty,
      changeQty: r.change_qty,
      reason: r.reason,
      changedAt: r.changed_at,
    }));
  } catch (error) {
    console.error("[getInventoryHistory] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoInventoryHistory(itemId);
  }
}
