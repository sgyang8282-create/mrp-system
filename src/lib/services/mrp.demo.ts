import { computeCapaLoads, computeNetRequirements, explodeRequirements } from "@/lib/mrp/engine";
import type { CapaGroupMeta, CapaItemMeta, BomEdge } from "@/lib/mrp/engine";
import type { MrpPageData, MrpResultLineRow, MrpRunSummary } from "@/types/mrp";
import type { CapaLoadItem } from "@/types/dashboard";
import type { ItemType } from "@/types/database";

// 04_DDL 샘플 데이터와 동일한 구조 (완제품A -> 반제품B,E -> 부품C,D,F)
const DEMO_ITEMS: { id: string; code: string; name: string; type: ItemType; groupId: string | null; workTimeMin: number }[] = [
  { id: "FG-A", code: "FG-A", name: "완제품A", type: "FINISHED", groupId: null, workTimeMin: 0 },
  { id: "SF-B", code: "SF-B", name: "반제품B", type: "SEMI", groupId: "grp-assembly1", workTimeMin: 12 },
  { id: "SF-E", code: "SF-E", name: "반제품E", type: "SEMI", groupId: "grp-assembly2", workTimeMin: 8 },
  { id: "PT-C", code: "PT-C", name: "부품C", type: "PART", groupId: "grp-injection1", workTimeMin: 3 },
  { id: "PT-D", code: "PT-D", name: "부품D", type: "PART", groupId: "grp-injection1", workTimeMin: 4 },
  { id: "PT-F", code: "PT-F", name: "부품F", type: "PART", groupId: "grp-process1", workTimeMin: 5 },
];

const DEMO_BOM: BomEdge[] = [
  { parentItemId: "FG-A", childItemId: "SF-B", quantityPer: 1 },
  { parentItemId: "FG-A", childItemId: "SF-E", quantityPer: 1 },
  { parentItemId: "SF-B", childItemId: "PT-C", quantityPer: 2 },
  { parentItemId: "SF-B", childItemId: "PT-D", quantityPer: 1 },
  { parentItemId: "SF-E", childItemId: "PT-F", quantityPer: 3 },
];

const DEMO_INVENTORY = new Map<string, number>([
  ["FG-A", 50],
  ["SF-B", 20],
  ["SF-E", 30],
  ["PT-C", 100],
  ["PT-D", 80],
  ["PT-F", 60],
]);

const DEMO_GROUPS: CapaGroupMeta[] = [
  { id: "grp-injection1", groupName: "사출1조", availableMinutes: 5 * 22 * 450 - 480 - 200 },
  { id: "grp-assembly1", groupName: "조립1조", availableMinutes: 8 * 22 * 450 - 960 - 300 },
  { id: "grp-assembly2", groupName: "조립2조", availableMinutes: 6 * 22 * 450 - 480 - 150 },
  { id: "grp-process1", groupName: "가공1조", availableMinutes: 4 * 22 * 450 - 240 - 100 },
];

const DEMO_PLAN_QTY = 1000;

function buildDemoResult() {
  const gross = explodeRequirements([{ itemId: "FG-A", qty: DEMO_PLAN_QTY }], DEMO_BOM);
  const net = computeNetRequirements(gross, DEMO_INVENTORY);

  const itemMetaById = new Map<string, CapaItemMeta>(
    DEMO_ITEMS.map((i) => [i.id, { itemId: i.id, productionGroupId: i.groupId, workTimeMin: i.workTimeMin }])
  );

  const capaLoads = computeCapaLoads(net, itemMetaById, DEMO_GROUPS);

  const results: MrpResultLineRow[] = net.map((line) => {
    const meta = DEMO_ITEMS.find((i) => i.id === line.itemId)!;
    return {
      id: `result-${line.itemId}`,
      itemId: line.itemId,
      itemCode: meta.code,
      itemName: meta.name,
      itemType: meta.type,
      bomLevel: line.bomLevel,
      grossRequirement: line.grossRequirement,
      onHandQty: line.onHandQty,
      netRequirement: line.netRequirement,
    };
  });

  return { results, capaLoads };
}

export function getDemoMrpRuns(): MrpRunSummary[] {
  return [{ id: "demo-run-1", planMonth: currentDemoPlanMonth(), status: "COMPLETED", executedAt: new Date().toISOString() }];
}

function currentDemoPlanMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export function getDemoMrpPageData(): MrpPageData {
  const { results } = buildDemoResult();
  return {
    runs: getDemoMrpRuns(),
    selectedRunId: "demo-run-1",
    results: results.sort((a, b) => a.bomLevel - b.bomLevel || a.itemCode.localeCompare(b.itemCode)),
    isDemoData: true,
  };
}

export function getDemoCapaLoads(): CapaLoadItem[] {
  const { capaLoads } = buildDemoResult();
  return capaLoads.map((c) => ({
    groupName: c.groupName,
    availableMinutes: c.availableMinutes,
    requiredMinutes: c.requiredMinutes,
    loadPct: c.loadPct,
  }));
}
