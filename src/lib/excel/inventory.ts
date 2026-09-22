import * as XLSX from "xlsx";
import type { InventoryRow } from "@/types/inventory";

export const INVENTORY_EXCEL_HEADERS = ["품목코드", "수량"] as const;

export interface InventoryExcelRawRow {
  row: number;
  품목코드: string;
  수량: number;
}

export function parseInventoryExcel(buffer: ArrayBuffer): InventoryExcelRawRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return json.map((row, idx) => ({
    row: idx + 2,
    품목코드: String(row["품목코드"] ?? "").trim(),
    수량: Number(row["수량"] ?? 0),
  }));
}

export function generateInventoryExcelBuffer(rows: InventoryRow[]): Buffer {
  const data = rows.map((row) => ({ 품목코드: row.itemCode, 수량: row.quantity }));
  const worksheet = XLSX.utils.json_to_sheet(data, { header: [...INVENTORY_EXCEL_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "현재고");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
