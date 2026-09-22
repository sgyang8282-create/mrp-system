import { generateDailySchedule, type GroupMeta, type ItemProductionMeta, type NetRequirementInput } from "@/lib/mrp/daily-plan-engine";
import { getDemoMrpPageData } from "@/lib/services/mrp.demo";
import type { DailyPlanData, DailyPlanRow } from "@/types/daily-plan";

const DEMO_ITEM_META: Record<string, ItemProductionMeta> = {
  "FG-A": { productionGroupId: null, workTimeMin: 0 },
  "SF-B": { productionGroupId: "grp-assembly1", workTimeMin: 12 },
  "SF-E": { productionGroupId: "grp-assembly2", workTimeMin: 8 },
  "PT-C": { productionGroupId: "grp-injection1", workTimeMin: 3 },
  "PT-D": { productionGroupId: "grp-injection1", workTimeMin: 4 },
  "PT-F": { productionGroupId: "grp-process1", workTimeMin: 5 },
};

const DEMO_GROUPS: (GroupMeta & { groupName: string })[] = [
  { id: "grp-injection1", groupName: "사출1조", headcount: 5 },
  { id: "grp-assembly1", groupName: "조립1조", headcount: 8 },
  { id: "grp-assembly2", groupName: "조립2조", headcount: 6 },
  { id: "grp-process1", groupName: "가공1조", headcount: 4 },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildSchedule() {
  const mrp = getDemoMrpPageData();
  const netLines: NetRequirementInput[] = mrp.results.map((r) => ({
    itemId: r.itemId,
    itemCode: r.itemCode,
    itemName: r.itemName,
    itemType: r.itemType,
    bomLevel: r.bomLevel,
    netRequirement: r.netRequirement,
  }));
  const itemMetaById = new Map(Object.entries(DEMO_ITEM_META));
  const { rows, unschedulable, daySpan } = generateDailySchedule(netLines, itemMetaById, DEMO_GROUPS, todayIso());

  const results = rows.map((r) => ({
    ...r,
    itemCode: r.itemId,
    itemName: netLines.find((n) => n.itemId === r.itemId)?.itemName ?? r.itemId,
  }));

  return { results, unschedulable, daySpan };
}

let cached: ReturnType<typeof buildSchedule> | null = null;
function getMemoizedDemoSchedule() {
  if (!cached) cached = buildSchedule();
  return cached;
}

export function getDemoDailyPlanData(planDate: string): DailyPlanData {
  const { results } = getMemoizedDemoSchedule();

  const plans: DailyPlanRow[] = results
    .filter((r) => r.planDate === planDate)
    .map((r) => ({
      id: `${r.itemId}-${r.planDate}`,
      planDate: r.planDate,
      itemId: r.itemId,
      itemCode: r.itemCode,
      itemName: r.itemName,
      productionGroupId: r.productionGroupId,
      groupName: DEMO_GROUPS.find((g) => g.id === r.productionGroupId)?.groupName ?? "-",
      plannedQty: r.plannedQty,
      plannedMinutes: r.plannedMinutes,
      inspectionStartDate: r.inspectionStartDate,
      inspectionEndDate: r.inspectionEndDate,
      status: "DRAFT" as const,
      source: "AUTO" as const,
    }));

  return { planDate, plans, isDemoData: true };
}

export function getDemoDailyPlanDateRange(): { minDate: string; maxDate: string } {
  const { results } = getMemoizedDemoSchedule();
  const dates = results.map((r) => r.planDate).sort();
  return { minDate: dates[0] ?? todayIso(), maxDate: dates[dates.length - 1] ?? todayIso() };
}
