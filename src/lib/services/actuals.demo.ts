import type { ActualsData } from "@/types/actual";

const DEMO_ITEMS = [
  { id: "FG-A", itemCode: "FG-A", itemName: "완제품A" },
  { id: "SF-B", itemCode: "SF-B", itemName: "반제품B" },
  { id: "SF-E", itemCode: "SF-E", itemName: "반제품E" },
  { id: "PT-C", itemCode: "PT-C", itemName: "부품C" },
  { id: "PT-D", itemCode: "PT-D", itemName: "부품D" },
  { id: "PT-F", itemCode: "PT-F", itemName: "부품F" },
];

export function getDemoActualsData(actualDate: string): ActualsData {
  return {
    actualDate,
    actuals: [
      {
        id: "actual-1",
        actualDate,
        itemId: "PT-C",
        itemCode: "PT-C",
        itemName: "부품C",
        qty: 180,
        defectQty: 4,
        inputType: "MANUAL",
        createdAt: new Date().toISOString(),
      },
      {
        id: "actual-2",
        actualDate,
        itemId: "SF-B",
        itemCode: "SF-B",
        itemName: "반제품B",
        qty: 60,
        defectQty: 1,
        inputType: "EXCEL",
        createdAt: new Date().toISOString(),
      },
    ],
    items: DEMO_ITEMS,
    isDemoData: true,
  };
}
