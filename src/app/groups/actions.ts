"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function parseGroupForm(formData: FormData) {
  return {
    groupName: String(formData.get("groupName") ?? "").trim(),
    headcount: Number(formData.get("headcount")),
    monthlyWorkDays: Number(formData.get("monthlyWorkDays")),
    annualLeaveMinutes: Number(formData.get("annualLeaveMinutes") ?? 0),
    otherLossMinutes: Number(formData.get("otherLossMinutes") ?? 0),
  };
}

function validateGroup(input: ReturnType<typeof parseGroupForm>): string | null {
  if (!input.groupName) return "그룹명을 입력해 주세요.";
  if (!Number.isFinite(input.headcount) || input.headcount < 0) return "근무인원수는 0 이상이어야 합니다.";
  if (!Number.isFinite(input.monthlyWorkDays) || input.monthlyWorkDays < 0)
    return "월근무일수는 0 이상이어야 합니다.";
  if (input.annualLeaveMinutes < 0) return "연차시간은 0 이상이어야 합니다.";
  if (input.otherLossMinutes < 0) return "기타손실시간은 0 이상이어야 합니다.";
  return null;
}

export async function createGroup(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "데모 모드에서는 저장할 수 없습니다. Supabase 연결 정보를 설정해 주세요." };
  }

  const input = parseGroupForm(formData);
  const validationError = validateGroup(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("production_groups").insert({
    group_name: input.groupName,
    headcount: input.headcount,
    monthly_work_days: input.monthlyWorkDays,
    annual_leave_minutes: input.annualLeaveMinutes,
    other_loss_minutes: input.otherLossMinutes,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/groups");
  return { ok: true };
}

export async function updateGroup(formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "데모 모드에서는 저장할 수 없습니다." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "그룹 정보가 올바르지 않습니다." };

  const input = parseGroupForm(formData);
  const validationError = validateGroup(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("production_groups")
    .update({
      group_name: input.groupName,
      headcount: input.headcount,
      monthly_work_days: input.monthlyWorkDays,
      annual_leave_minutes: input.annualLeaveMinutes,
      other_loss_minutes: input.otherLossMinutes,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/groups");
  return { ok: true };
}

export async function deleteGroup(id: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "데모 모드에서는 삭제할 수 없습니다." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("production_groups").delete().eq("id", id);

  if (error) {
    // 품목/BOM 라인에서 참조 중이면 FK 제약으로 실패할 수 있음(on delete set null 대상은 예외)
    return { ok: false, error: error.message };
  }

  revalidatePath("/groups");
  return { ok: true };
}
