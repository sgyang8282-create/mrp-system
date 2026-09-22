import type { DailyPlanStatus, PlanSource } from "@/types/database";

export interface DailyPlanRow {
  id: string;
  planDate: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  productionGroupId: string;
  groupName: string;
  plannedQty: number;
  plannedMinutes: number;
  inspectionStartDate: string | null;
  inspectionEndDate: string | null;
  status: DailyPlanStatus;
  source: PlanSource;
}

export interface DailyPlanData {
  planDate: string;
  plans: DailyPlanRow[];
  isDemoData: boolean;
}

export interface UnassignableItem {
  itemCode: string;
  itemName: string;
  netRequirement: number;
  reason: string;
}

export interface GenerateDailyPlanResult {
  ok: boolean;
  error?: string;
  createdCount?: number;
  daySpan?: number;
  unassignableItems?: UnassignableItem[];
}
