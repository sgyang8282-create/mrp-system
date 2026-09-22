"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { generateDailyPlansFromRun } from "@/lib/services/daily-plans";
import type { GenerateDailyPlanResult } from "@/types/daily-plan";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function generateDailyPlans(runId: string, startDate: string): Promise<GenerateDailyPlanResult> {
  const result = await generateDailyPlansFromRun(runId, startDate);
  if (result.ok) revalidatePath("/daily-plans");
  return result;
}

export async function updateDailyPlanQty(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const plannedQty = Number(formData.get("plannedQty"));

  if (!id) return { ok: false, error: "계획 정보가 올바르지 않습니다." };
  if (!Number.isFinite(plannedQty) || plannedQty < 0) return { ok: false, error: "수량은 0 이상이어야 합니다." };
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 저장할 수 없습니다." };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("daily_plans")
    .update({ planned_qty: plannedQty, source: "MANUAL" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/daily-plans");
  return { ok: true };
}

export async function confirmDailyPlan(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 확정할 수 없습니다." };
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("daily_plans").update({ status: "CONFIRMED" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/daily-plans");
  return { ok: true };
}

export async function lockDailyPlan(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 잠글 수 없습니다." };
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("daily_plans").update({ status: "LOCKED" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/daily-plans");
  return { ok: true };
}

export async function deleteDailyPlan(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "데모 모드에서는 삭제할 수 없습니다." };
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("daily_plans").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/daily-plans");
  return { ok: true };
}
