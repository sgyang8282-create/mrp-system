import * as XLSX from "xlsx";
import type { ActualRow } from "@/types/actual";

export const ACTUALS_EXCEL_HEADERS = ["날짜", "품목코드", "수량"] as const;

export interface ActualsExcelRawRow {
  row: number;
  날짜: string;
  품목코드: string;
  수량: number;
}

function excelDateToIso(value: unknown): string {
  if (typeof value === "number") {
    // 엑셀 시리얼 날짜
    const date = XLSX.SSF.parse_date_code(value);
    const mm = String(date.m).padStart(2, "0");
    const dd = String(date.d).padStart(2, "0");
    return `${date.y}-${mm}-${dd}`;
  }
  const str = String(value ?? "").trim();
  // 이미 YYYY-MM-DD 형식이면 그대로, 아니면 Date 파싱 시도
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return str;
}

export function parseActualsExcel(buffer: ArrayBuffer): ActualsExcelRawRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return json.map((row, idx) => ({
    row: idx + 2,
    날짜: excelDateToIso(row["날짜"]),
    품목코드: String(row["품목코드"] ?? "").trim(),
    수량: Number(row["수량"] ?? 0),
  }));
}

export function generateActualsExcelBuffer(rows: ActualRow[]): Buffer {
  const data = rows.map((row) => ({ 날짜: row.actualDate, 품목코드: row.itemCode, 수량: row.qty }));
  const worksheet = XLSX.utils.json_to_sheet(data, { header: [...ACTUALS_EXCEL_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "생산실적");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
