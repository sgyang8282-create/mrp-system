"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getBomData } from "@/lib/services/bom";
import { wouldCreateCycle } from "@/lib/bom/tree";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createBomLine(formData: FormData): Promise<ActionResult> {
  const parentItemId = String(formData.get("parentItemId") ?? "");
  const childItemId = String(formData.get("childItemId") ?? "");
  const quantityPer = Number(formData.get("quantityPer"));
  const workTimeMin = Number(formData.get("workTimeMin") ?? 0);
  const productionGroupId = String(formData.get("productionGroupId") ?? "") || null;

  if (!parentItemId || !childItemId) {
    return { ok: false, error: "모품목과 자품목을 모두 선택해 주세요." };
  }
  if (parentItemId === childItemId) {
    return { ok: false, error: "모품목과 자품목은 같을 수 없습니다." };
  }
  if (!quantityPer || quantityPer <= 0) {
    return { ok: false, error: "정미수량은 0보다 커야 합니다." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "데모 모드에서는 저장할 수 없습니다. Supabase 연결 정보를 설정해 주세요.",
    };
  }

  // 클라이언트/서버 액션 단계에서의 1차 순환참조 검증 (최종 방어선은 DB 트리거)
  const { lines } = await getBomData();
  if (wouldCreateCycle(lines, parentItemId, childItemId)) {
    return {
      ok: false,
      error: "이 관계를 추가하면 BOM 순환 참조가 발생합니다. 하위 품목 구조를 다시 확인해 주세요.",
    };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("bom_lines").insert({
    parent_item_id: parentItemId,
    child_item_id: childItemId,
    quantity_per: quantityPer,
    work_time_min: workTimeMin || null,
    production_group_id: productionGroupId,
  });

  if (error) {
    // DB 트리거(check_bom_cycle)가 최종적으로 순환참조를 감지한 경우 등
    return { ok: false, error: error.message };
  }

  revalidatePath("/bom");
  return { ok: true };
}

export async function deleteBomLine(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "데모 모드에서는 삭제할 수 없습니다." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("bom_lines").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/bom");
  return { ok: true };
}
