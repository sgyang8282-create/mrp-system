import * as XLSX from "xlsx";
import { itemTypeToLabel } from "@/lib/excel/bom";
import type { MrpResultLineRow } from "@/types/mrp";

export function generateMrpResultExcelBuffer(results: MrpResultLineRow[]): Buffer {
  const rows = results.map((r) => ({
    레벨: r.bomLevel,
    품목코드: r.itemCode,
    품목명: r.itemName,
    구분: itemTypeToLabel(r.itemType),
    총소요량: r.grossRequirement,
    현재고: r.onHandQty,
    순소요량: r.netRequirement,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MRP전개결과");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
