import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseActualsExcel } from "@/lib/excel/actuals";
import type { ImportRowError } from "@/types/actual";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase 연결 정보가 설정되지 않아 업로드할 수 없습니다 (데모 모드)." },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "업로드할 엑셀 파일(file)이 필요합니다." }, { status: 400 });
  }

  const rows = parseActualsExcel(await file.arrayBuffer());
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "엑셀에서 읽은 데이터가 없습니다. 템플릿 형식(날짜, 품목코드, 수량)을 확인해 주세요." },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: itemRows } = await supabase.from("items").select("id, item_code");
  const itemByCode = new Map((itemRows ?? []).map((i: any) => [i.item_code, i.id]));

  const failedRows: ImportRowError[] = [];
  const toInsert: { actual_date: string; item_id: string; qty: number; input_type: "EXCEL"; created_by: string | null }[] = [];

  for (const row of rows) {
    if (!row.날짜 || !/^\d{4}-\d{2}-\d{2}$/.test(row.날짜)) {
      failedRows.push({ row: row.row, reason: `날짜 형식이 올바르지 않습니다: '${row.날짜}'` });
      continue;
    }
    if (!row.품목코드) {
      failedRows.push({ row: row.row, reason: "품목코드는 필수입니다." });
      continue;
    }
    const itemId = itemByCode.get(row.품목코드);
    if (!itemId) {
      failedRows.push({ row: row.row, reason: `품목코드 '${row.품목코드}'가 존재하지 않습니다.` });
      continue;
    }
    if (!Number.isFinite(row.수량) || row.수량 < 0) {
      failedRows.push({ row: row.row, reason: "수량은 0 이상의 숫자여야 합니다." });
      continue;
    }

    toInsert.push({
      actual_date: row.날짜,
      item_id: itemId,
      qty: row.수량,
      input_type: "EXCEL",
      created_by: user?.id ?? null,
    });
  }

  let successCount = 0;
  if (toInsert.length > 0) {
    const { error, count } = await supabase.from("production_actuals").insert(toInsert, { count: "exact" });
    if (error) {
      failedRows.push({ row: 0, reason: `저장 중 오류가 발생했습니다: ${error.message}` });
    } else {
      successCount = count ?? toInsert.length;
    }
  }

  return NextResponse.json({ totalRows: rows.length, successCount, failedRows });
}
