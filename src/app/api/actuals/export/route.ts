import { NextRequest, NextResponse } from "next/server";
import { getActualsData, todayIso } from "@/lib/services/actuals";
import { generateActualsExcelBuffer } from "@/lib/excel/actuals";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? todayIso();
  const { actuals } = await getActualsData(date);
  const buffer = generateActualsExcelBuffer(actuals);
  const filename = `생산실적_${date}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
