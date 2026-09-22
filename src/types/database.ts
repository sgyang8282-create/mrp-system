// 04_DDL_제조업_MRP시스템.sql 스키마를 기준으로 작성한 타입.
// 운영 전환 시 `supabase gen types typescript`로 자동 생성본으로 교체 권장.

export type UserRole = "admin" | "leader" | "worker";
export type ItemType = "FINISHED" | "SEMI" | "PART";
export type PlanStatus = "DRAFT" | "CONFIRMED";
export type RunStatus = "RUNNING" | "COMPLETED" | "FAILED";
export type DailyPlanStatus = "DRAFT" | "CONFIRMED" | "LOCKED";
export type PlanSource = "AUTO" | "MANUAL";
export type AlertLevel = "NONE" | "WARNING" | "CRITICAL";

export interface ProductionGroup {
  id: string;
  group_name: string;
  headcount: number;
  monthly_work_days: number;
  annual_leave_minutes: number;
  other_loss_minutes: number;
  available_minutes: number;
}

export interface Item {
  id: string;
  item_code: string;
  item_name: string;
  item_type: ItemType;
  unit: string;
  production_group_id: string | null;
  work_time_min: number;
  is_active: boolean;
}

export interface Inventory {
  item_id: string;
  quantity: number;
  updated_at: string;
}

export interface MonthlyPlan {
  id: string;
  plan_month: string;
  item_id: string;
  plan_qty: number;
  status: PlanStatus;
}

export interface MrpRun {
  id: string;
  plan_month: string;
  status: RunStatus;
  executed_at: string;
}

export interface CapaResult {
  id: string;
  run_id: string;
  production_group_id: string;
  available_minutes: number;
  required_minutes: number;
  load_pct: number;
}

export interface DailyPlan {
  id: string;
  plan_date: string;
  item_id: string;
  production_group_id: string;
  assigned_to: string | null;
  planned_qty: number;
  planned_minutes: number;
  status: DailyPlanStatus;
  source: PlanSource;
}

export interface ProductionActual {
  id: string;
  actual_date: string;
  item_id: string;
  qty: number;
  defect_qty: number;
  daily_plan_id: string | null;
}

export interface InventorySimulationDaily {
  id: string;
  sim_date: string;
  item_id: string;
  beginning_qty: number;
  production_qty: number;
  requirement_qty: number;
  shipment_qty: number;
  defect_qty: number;
  expected_qty: number;
  alert_level: AlertLevel;
}
