"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function submitProductionActual(formData: FormData): Promise<ActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  const actualDate = String(formData.get("actualDate") ?? "");
  const qty = Number(formData.get("qty"));
  const defectQty = Number(formData.get("defectQty") ?? 0);

  if (!itemId || !actualDate) return { ok: false, error: "품목과 날짜를 모두 입력해 주세요." };
  if (!Number.isFinite(qty) || qty < 0) return { ok: false, error: "수량은 0 이상이어야 합니다." };
  if (!Number.isFinite(defectQty) || defectQty < 0) return { ok: false, error: "불량수량은 0 이상이어야 합니다." };
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 저장할 수 없습니다." };

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("production_actuals").insert({
    item_id: itemId,
    actual_date: actualDate,
    qty,
    defect_qty: defectQty,
    input_type: "MANUAL",
    created_by: user?.id ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/actuals");
  revalidatePath("/plan-vs-actual");
  revalidatePath("/dashboard");
  return { ok: true };
}
