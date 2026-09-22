import { NextResponse } from "next/server";
import { getMrpPageData } from "@/lib/services/mrp";
import { generateMrpResultExcelBuffer } from "@/lib/excel/mrp";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { runId: string } }) {
  const { results } = await getMrpPageData(params.runId);
  const buffer = generateMrpResultExcelBuffer(results);
  const filename = `MRP전개결과_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
