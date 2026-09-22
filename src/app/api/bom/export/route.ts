import { NextResponse } from "next/server";
import { getBomData } from "@/lib/services/bom";
import { generateBomExcelBuffer } from "@/lib/excel/bom";

export const runtime = "nodejs";

export async function GET() {
  const { lines } = await getBomData();
  const buffer = generateBomExcelBuffer(lines);
  const filename = `BOM_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
