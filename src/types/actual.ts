import type { InputType } from "@/types/database";

export interface ActualRow {
  id: string;
  actualDate: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  defectQty: number;
  inputType: InputType;
  createdAt: string;
}

export interface ActualItemOption {
  id: string;
  itemCode: string;
  itemName: string;
}

export interface ActualsData {
  actualDate: string;
  actuals: ActualRow[];
  items: ActualItemOption[];
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
