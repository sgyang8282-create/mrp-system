import type { ItemType, PlanStatus, RunStatus } from "@/types/database";

export interface MonthlyPlanRow {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  planQty: number;
  status: PlanStatus;
}

export interface FinishedItemOption {
  id: string;
  itemCode: string;
  itemName: string;
}

export interface MonthlyPlanData {
  planMonth: string; // YYYY-MM-01
  plans: MonthlyPlanRow[];
  finishedItems: FinishedItemOption[];
  latestRunId: string | null;
  isDemoData: boolean;
}

export interface MrpRunSummary {
  id: string;
  planMonth: string;
  status: RunStatus;
  executedAt: string;
}

export interface MrpResultLineRow {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  bomLevel: number;
  grossRequirement: number;
  onHandQty: number;
  netRequirement: number;
}

export interface MrpPageData {
  runs: MrpRunSummary[];
  selectedRunId: string | null;
  results: MrpResultLineRow[];
  isDemoData: boolean;
}
