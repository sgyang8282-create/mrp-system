import type { MonthlyPlanData } from "@/types/mrp";

const DEMO_FINISHED_ITEMS = [{ id: "FG-A", itemCode: "FG-A", itemName: "완제품A" }];

export function getDemoMonthlyPlanData(planMonth: string): MonthlyPlanData {
  return {
    planMonth,
    plans: [{ id: "plan-1", itemId: "FG-A", itemCode: "FG-A", itemName: "완제품A", planQty: 1000, status: "CONFIRMED" }],
    finishedItems: DEMO_FINISHED_ITEMS,
    latestRunId: "demo-run-1",
    isDemoData: true,
  };
}
