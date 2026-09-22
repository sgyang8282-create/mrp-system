"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getInventoryHistory } from "@/lib/services/inventory";
import type { InventoryHistoryRow } from "@/types/inventory";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function getInventoryHistoryAction(itemId: string): Promise<InventoryHistoryRow[]> {
  return getInventoryHistory(itemId);
}


export async function updateInventoryQuantity(formData: FormData): Promise<ActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!itemId) {
    return { ok: false, error: "품목 정보가 올바르지 않습니다." };
  }
  if (Number.isNaN(quantity) || quantity < 0) {
    return { ok: false, error: "수량은 0 이상의 숫자여야 합니다." };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "데모 모드에서는 저장할 수 없습니다. Supabase 연결 정보를 설정해 주세요." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.rpc("admin_update_inventory", {
    p_item_id: itemId,
    p_quantity: quantity,
    p_reason: reason || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/inventory");
  return { ok: true };
}
