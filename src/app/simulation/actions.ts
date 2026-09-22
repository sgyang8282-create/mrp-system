"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createInventoryAdjustment(formData: FormData): Promise<ActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  const adjustmentType = String(formData.get("adjustmentType") ?? "");
  const qty = Number(formData.get("qty"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!itemId) return { ok: false, error: "품목을 선택해 주세요." };
  if (!["SHIPMENT_OUT", "DISPOSAL", "CORRECTION"].includes(adjustmentType)) {
    return { ok: false, error: "조정 유형이 올바르지 않습니다." };
  }
  if (!Number.isFinite(qty) || qty === 0) return { ok: false, error: "수량을 입력해 주세요 (0이 될 수 없습니다)." };
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 저장할 수 없습니다." };

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("inventory_adjustments").insert({
    item_id: itemId,
    adjustment_type: adjustmentType,
    qty,
    reason: reason || null,
    created_by: user?.id ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/simulation");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true };
}
