import { NextResponse } from "next/server";
import { getInventoryData } from "@/lib/services/inventory";
import { generateInventoryExcelBuffer } from "@/lib/excel/inventory";

export const runtime = "nodejs";

export async function GET() {
  const { rows } = await getInventoryData();
  const buffer = generateInventoryExcelBuffer(rows);
  const filename = `현재고_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
