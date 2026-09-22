import * as XLSX from "xlsx";
import type { BomLineRow } from "@/types/bom";
import type { ItemType } from "@/types/database";

export const BOM_EXCEL_HEADERS = ["모품목", "자품목", "생산그룹", "작업소요시간", "정미수량", "반제품구분"] as const;

export interface BomExcelRawRow {
  row: number; // 엑셀 상 실제 행 번호 (헤더=1)
  모품목: string;
  자품목: string;
  생산그룹: string;
  작업소요시간: number;
  정미수량: number;
  반제품구분: string;
}

const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  FINISHED: "완제품",
  SEMI: "반제품",
  PART: "부품",
};

const LABEL_TO_ITEM_TYPE: Record<string, ItemType> = {
  완제품: "FINISHED",
  반제품: "SEMI",
  부품: "PART",
};

export function itemTypeToLabel(type: ItemType): string {
  return ITEM_TYPE_LABEL[type];
}

export function labelToItemType(label: string): ItemType | null {
  return LABEL_TO_ITEM_TYPE[label.trim()] ?? null;
}

/** 업로드된 엑셀(ArrayBuffer)을 파싱해 원본 행 배열로 반환한다. 계산/검증은 호출부에서 수행. */
export function parseBomExcel(buffer: ArrayBuffer): BomExcelRawRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return json.map((row, idx) => ({
    row: idx + 2, // 1행은 헤더
    모품목: String(row["모품목"] ?? "").trim(),
    자품목: String(row["자품목"] ?? "").trim(),
    생산그룹: String(row["생산그룹"] ?? "").trim(),
    작업소요시간: Number(row["작업소요시간"] ?? 0),
    정미수량: Number(row["정미수량"] ?? 0),
    반제품구분: String(row["반제품구분"] ?? "").trim(),
  }));
}

/** 현재 등록된 BOM 라인을 업로드 템플릿과 동일한 형식의 엑셀 버퍼로 생성한다. */
export function generateBomExcelBuffer(lines: BomLineRow[]): Buffer {
  const rows = lines.map((line) => ({
    모품목: line.parentItemCode,
    자품목: line.childItemCode,
    생산그룹: line.groupName ?? "",
    작업소요시간: line.workTimeMin,
    정미수량: line.quantityPer,
    반제품구분: itemTypeToLabel(line.childItemType),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...BOM_EXCEL_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "BOM");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/** 빈 업로드 템플릿(헤더만 있는) 버퍼를 생성한다. */
export function generateBomTemplateBuffer(): Buffer {
  const worksheet = XLSX.utils.json_to_sheet([], { header: [...BOM_EXCEL_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "BOM");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
