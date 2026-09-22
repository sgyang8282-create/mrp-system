import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDemoGroupsData } from "@/lib/services/groups.demo";
import type { GroupsData, ProductionGroupRow } from "@/types/group";

export async function getGroupsData(): Promise<GroupsData> {
  if (!isSupabaseConfigured()) {
    return getDemoGroupsData();
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("production_groups")
      .select(
        "id, group_name, headcount, monthly_work_days, annual_leave_minutes, other_loss_minutes, available_minutes"
      )
      .order("group_name");

    if (error) throw error;

    const rows: ProductionGroupRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      groupName: r.group_name,
      headcount: r.headcount,
      monthlyWorkDays: r.monthly_work_days,
      annualLeaveMinutes: r.annual_leave_minutes,
      otherLossMinutes: r.other_loss_minutes,
      availableMinutes: r.available_minutes,
    }));

    return { rows, isDemoData: false };
  } catch (error) {
    console.error("[getGroupsData] Supabase 조회 실패, 데모 데이터로 대체합니다.", error);
    return getDemoGroupsData();
  }
}
