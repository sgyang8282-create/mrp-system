"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { runMrp, type RunMrpResult } from "@/lib/services/mrp";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createMonthlyPlan(formData: FormData): Promise<ActionResult> {
  const itemId = String(formData.get("itemId") ?? "");
  const planMonth = String(formData.get("planMonth") ?? "");
  const planQty = Number(formData.get("planQty"));

  if (!itemId || !planMonth) return { ok: false, error: "품목과 대상 월을 선택해 주세요." };
  if (!Number.isFinite(planQty) || planQty < 0) return { ok: false, error: "계획수량은 0 이상이어야 합니다." };
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 저장할 수 없습니다." };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("monthly_plans")
    .upsert(
      { item_id: itemId, plan_month: planMonth, plan_qty: planQty, status: "DRAFT" },
      { onConflict: "plan_month,item_id" }
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly-plans");
  return { ok: true };
}

export async function updateMonthlyPlanQty(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const planQty = Number(formData.get("planQty"));

  if (!id) return { ok: false, error: "계획 정보가 올바르지 않습니다." };
  if (!Number.isFinite(planQty) || planQty < 0) return { ok: false, error: "계획수량은 0 이상이어야 합니다." };
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 저장할 수 없습니다." };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("monthly_plans").update({ plan_qty: planQty }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly-plans");
  return { ok: true };
}

export async function confirmMonthlyPlan(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 확정할 수 없습니다." };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("monthly_plans").update({ status: "CONFIRMED" }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly-plans");
  return { ok: true };
}

export async function deleteMonthlyPlan(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 삭제할 수 없습니다." };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("monthly_plans").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/monthly-plans");
  return { ok: true };
}

export async function runMrpForMonth(planMonth: string): Promise<RunMrpResult> {
  const result = await runMrp(planMonth);
  if (result.ok) {
    revalidatePath("/monthly-plans");
    revalidatePath("/mrp");
    revalidatePath("/capa");
    revalidatePath("/dashboard");
  }
  return result;
}
