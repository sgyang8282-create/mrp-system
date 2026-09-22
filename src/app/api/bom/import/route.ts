import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { parseBomExcel, labelToItemType } from "@/lib/excel/bom";
import { wouldCreateCycle } from "@/lib/bom/tree";
import type { BomLineRow, ImportRowError } from "@/types/bom";

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

  const buffer = await file.arrayBuffer();
  const rows = parseBomExcel(buffer);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "엑셀에서 읽은 데이터가 없습니다. 템플릿 형식을 확인해 주세요." },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  const [{ data: itemRows }, { data: groupRows }, { data: existingLineRows }] = await Promise.all([
    supabase.from("items").select("id, item_code, item_type"),
    supabase.from("production_groups").select("id, group_name"),
    supabase.from("bom_lines").select("parent_item_id, child_item_id"),
  ]);

  const itemByCode = new Map((itemRows ?? []).map((i: any) => [i.item_code, i]));
  const groupByName = new Map((groupRows ?? []).map((g: any) => [g.group_name, g]));

  // 순환참조 검사는 기존 라인 + 이번 업로드에서 누적되는 라인을 함께 반영해야 정확하다.
  const cycleCheckLines: BomLineRow[] = (existingLineRows ?? []).map((l: any) => ({
    id: "",
    parentItemId: l.parent_item_id,
    parentItemCode: "",
    parentItemName: "",
    childItemId: l.child_item_id,
    childItemCode: "",
    childItemName: "",
    childItemType: "PART",
    quantityPer: 0,
    workTimeMin: 0,
    groupName: null,
  }));

  const failedRows: ImportRowError[] = [];
  const toInsert: {
    parent_item_id: string;
    child_item_id: string;
    quantity_per: number;
    work_time_min: number | null;
    production_group_id: string | null;
  }[] = [];

  for (const row of rows) {
    if (!row.모품목 || !row.자품목) {
      failedRows.push({ row: row.row, reason: "모품목/자품목은 필수입니다." });
      continue;
    }

    const parentItem = itemByCode.get(row.모품목);
    const childItem = itemByCode.get(row.자품목);

    if (!parentItem) {
      failedRows.push({ row: row.row, reason: `모품목 코드 '${row.모품목}'가 존재하지 않습니다.` });
      continue;
    }
    if (!childItem) {
      failedRows.push({ row: row.row, reason: `자품목 코드 '${row.자품목}'가 존재하지 않습니다.` });
      continue;
    }
    if (row.모품목 === row.자품목) {
      failedRows.push({ row: row.row, reason: "모품목과 자품목은 같을 수 없습니다." });
      continue;
    }
    if (!row.정미수량 || row.정미수량 <= 0) {
      failedRows.push({ row: row.row, reason: "정미수량은 0보다 커야 합니다." });
      continue;
    }

    const expectedType = labelToItemType(row.반제품구분);
    if (row.반제품구분 && expectedType && expectedType !== childItem.item_type) {
      failedRows.push({
        row: row.row,
        reason: `반제품구분('${row.반제품구분}')이 자품목 '${row.자품목}'의 실제 품목구분과 일치하지 않습니다.`,
      });
      continue;
    }

    let groupId: string | null = null;
    if (row.생산그룹) {
      const group = groupByName.get(row.생산그룹);
      if (!group) {
        failedRows.push({ row: row.row, reason: `생산그룹 '${row.생산그룹}'가 존재하지 않습니다.` });
        continue;
      }
      groupId = group.id;
    }

    if (wouldCreateCycle(cycleCheckLines, parentItem.id, childItem.id)) {
      failedRows.push({
        row: row.row,
        reason: "이 관계를 추가하면 BOM 순환 참조가 발생합니다.",
      });
      continue;
    }

    // 이번 파일 내 누적 검증에 반영
    cycleCheckLines.push({
      id: "",
      parentItemId: parentItem.id,
      parentItemCode: "",
      parentItemName: "",
      childItemId: childItem.id,
      childItemCode: "",
      childItemName: "",
      childItemType: "PART",
      quantityPer: row.정미수량,
      workTimeMin: row.작업소요시간,
      groupName: null,
    });

    toInsert.push({
      parent_item_id: parentItem.id,
      child_item_id: childItem.id,
      quantity_per: row.정미수량,
      work_time_min: row.작업소요시간 || null,
      production_group_id: groupId,
    });
  }

  let successCount = 0;
  if (toInsert.length > 0) {
    const { error, count } = await supabase
      .from("bom_lines")
      .upsert(toInsert, { onConflict: "parent_item_id,child_item_id", count: "exact" });

    if (error) {
      // 배치 전체가 실패한 경우 (예: DB 트리거가 개별 행에서 순환참조를 최종 감지)
      failedRows.push({ row: 0, reason: `저장 중 오류가 발생했습니다: ${error.message}` });
    } else {
      successCount = count ?? toInsert.length;
    }
  }

  return NextResponse.json({
    totalRows: rows.length,
    successCount,
    failedRows,
  });
}
