import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseInventoryExcel } from "@/lib/excel/inventory";
import type { ImportRowError } from "@/types/inventory";

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

  const rows = parseInventoryExcel(await file.arrayBuffer());
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "엑셀에서 읽은 데이터가 없습니다. 템플릿 형식(품목코드, 수량)을 확인해 주세요." },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();
  const { data: itemRows } = await supabase.from("items").select("id, item_code");
  const itemByCode = new Map((itemRows ?? []).map((i: any) => [i.item_code, i.id]));

  const failedRows: ImportRowError[] = [];
  let successCount = 0;

  for (const row of rows) {
    if (!row.품목코드) {
      failedRows.push({ row: row.row, reason: "품목코드는 필수입니다." });
      continue;
    }
    const itemId = itemByCode.get(row.품목코드);
    if (!itemId) {
      failedRows.push({ row: row.row, reason: `품목코드 '${row.품목코드}'가 존재하지 않습니다.` });
      continue;
    }
    if (Number.isNaN(row.수량) || row.수량 < 0) {
      failedRows.push({ row: row.row, reason: "수량은 0 이상의 숫자여야 합니다." });
      continue;
    }

    const { error } = await supabase.rpc("admin_update_inventory", {
      p_item_id: itemId,
      p_quantity: row.수량,
      p_reason: "엑셀 업로드 일괄 갱신",
    });

    if (error) {
      failedRows.push({ row: row.row, reason: error.message });
    } else {
      successCount += 1;
    }
  }

  return NextResponse.json({ totalRows: rows.length, successCount, failedRows });
}
