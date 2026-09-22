import type { ItemType } from "@/types/database";

export interface InventoryRow {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  unit: string;
  quantity: number;
  updatedAt: string;
}

export interface InventoryHistoryRow {
  id: string;
  beforeQty: number;
  afterQty: number;
  changeQty: number;
  reason: string | null;
  changedAt: string;
}

export interface InventoryData {
  rows: InventoryRow[];
  isDemoData: boolean;
}

export interface ImportRowError {
  row: number;
  reason: string;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedRows: ImportRowError[];
}
