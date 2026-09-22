import type { InventoryData, InventoryHistoryRow, InventoryRow } from "@/types/inventory";

const rows: InventoryRow[] = [
  { itemId: "FG-A", itemCode: "FG-A", itemName: "완제품A", itemType: "FINISHED", unit: "EA", quantity: 50, updatedAt: new Date().toISOString() },
  { itemId: "SF-B", itemCode: "SF-B", itemName: "반제품B", itemType: "SEMI", unit: "EA", quantity: 20, updatedAt: new Date().toISOString() },
  { itemId: "SF-E", itemCode: "SF-E", itemName: "반제품E", itemType: "SEMI", unit: "EA", quantity: 30, updatedAt: new Date().toISOString() },
  { itemId: "PT-C", itemCode: "PT-C", itemName: "부품C", itemType: "PART", unit: "EA", quantity: 100, updatedAt: new Date().toISOString() },
  { itemId: "PT-D", itemCode: "PT-D", itemName: "부품D", itemType: "PART", unit: "EA", quantity: 80, updatedAt: new Date().toISOString() },
  { itemId: "PT-F", itemCode: "PT-F", itemName: "부품F", itemType: "PART", unit: "EA", quantity: 60, updatedAt: new Date().toISOString() },
];

export function getDemoInventoryData(): InventoryData {
  return { rows, isDemoData: true };
}

export function getDemoInventoryHistory(itemId: string): InventoryHistoryRow[] {
  const current = rows.find((r) => r.itemId === itemId);
  if (!current) return [];
  return [
    {
      id: "hist-2",
      beforeQty: current.quantity - 15,
      afterQty: current.quantity,
      changeQty: 15,
      reason: "생산실적 반영",
      changedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: "hist-1",
      beforeQty: 0,
      afterQty: current.quantity - 15,
      changeQty: current.quantity - 15,
      reason: "최초 등록",
      changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
  ];
}
