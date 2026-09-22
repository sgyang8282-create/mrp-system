import { simulateInventory, type DailyInputs } from "@/lib/mrp/simulation-engine";
import type { SimulationData, SimulationItemOption } from "@/types/simulation";

const DEMO_ITEMS: SimulationItemOption[] = [
  { id: "FG-A", itemCode: "FG-A", itemName: "완제품A" },
  { id: "SF-B", itemCode: "SF-B", itemName: "반제품B" },
  { id: "SF-E", itemCode: "SF-E", itemName: "반제품E" },
  { id: "PT-C", itemCode: "PT-C", itemName: "부품C" },
  { id: "PT-D", itemCode: "PT-D", itemName: "부품D" },
  { id: "PT-F", itemCode: "PT-F", itemName: "부품F" },
];

const DEMO_CURRENT_QTY: Record<string, number> = {
  "FG-A": 50,
  "SF-B": 20,
  "SF-E": 30,
  "PT-C": 100,
  "PT-D": 80,
  "PT-F": 60,
};

// 데모용 일별 시나리오: 부품F는 생산 지연으로 3일 이내 품절 위험, 부품C는 이미 부족.
const DEMO_SCENARIOS: Record<string, { productionQty: number; requirementQty: number }[]> = {
  "PT-C": [
    { productionQty: 40, requirementQty: 80 },
    { productionQty: 40, requirementQty: 80 },
    { productionQty: 40, requirementQty: 40 },
    { productionQty: 40, requirementQty: 40 },
  ],
  "PT-F": [
    { productionQty: 0, requirementQty: 20 },
    { productionQty: 0, requirementQty: 20 },
    { productionQty: 0, requirementQty: 20 },
    { productionQty: 60, requirementQty: 20 },
  ],
  "SF-B": [
    { productionQty: 10, requirementQty: 5 },
    { productionQty: 10, requirementQty: 5 },
    { productionQty: 10, requirementQty: 5 },
  ],
};

function isoPlusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function getDemoSimulationData(itemId: string, days: number): SimulationData {
  const item = DEMO_ITEMS.find((i) => i.id === itemId) ?? DEMO_ITEMS[0];
  const currentQty = DEMO_CURRENT_QTY[item.id] ?? 0;
  const scenario = DEMO_SCENARIOS[item.id] ?? [];

  const inputs: DailyInputs[] = Array.from({ length: days }, (_, i) => {
    const s = scenario[i % Math.max(scenario.length, 1)] ?? { productionQty: 0, requirementQty: 0 };
    return {
      date: isoPlusDays(i),
      productionQty: scenario.length > 0 ? s.productionQty : 0,
      requirementQty: scenario.length > 0 ? s.requirementQty : 0,
      shipmentQty: 0,
      defectQty: 0,
    };
  });

  const simulated = simulateInventory(currentQty, inputs);

  return {
    itemId: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    currentQty,
    days: simulated,
    items: DEMO_ITEMS,
    isDemoData: true,
  };
}
