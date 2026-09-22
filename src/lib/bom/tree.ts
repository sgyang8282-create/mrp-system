import type { BomLineRow, BomTreeNode, ItemOption } from "@/types/bom";

/**
 * 평탄화된 BOM 라인 목록으로부터 다단계 트리(숲, forest)를 구성한다.
 * DB에는 이미 순환참조 방지 트리거가 있지만(04_DDL check_bom_cycle),
 * 화면 렌더링 단계에서도 2중 안전장치로 경로(path)를 추적해 무한 루프를 막는다.
 */
export function buildBomForest(items: ItemOption[], lines: BomLineRow[]): BomTreeNode[] {
  const itemById = new Map(items.map((i) => [i.id, i]));
  const childIds = new Set(lines.map((l) => l.childItemId));
  const linesByParent = new Map<string, BomLineRow[]>();
  for (const line of lines) {
    const arr = linesByParent.get(line.parentItemId) ?? [];
    arr.push(line);
    linesByParent.set(line.parentItemId, arr);
  }

  // 루트 = 어떤 BOM 라인의 자품목으로도 등장하지 않는 품목 (보통 완제품)
  const rootItems = items.filter((i) => !childIds.has(i.id));

  function build(
    itemId: string,
    quantityPer: number,
    cumulativeQty: number,
    path: Set<string>,
    bomLineId: string | undefined,
    groupName: string | null,
    workTimeMin: number
  ): BomTreeNode {
    const item = itemById.get(itemId);
    const children = linesByParent.get(itemId) ?? [];

    if (path.has(itemId)) {
      return {
        itemId,
        itemCode: item?.itemCode ?? "?",
        itemName: item?.itemName ?? "알 수 없음",
        itemType: item?.itemType ?? "PART",
        quantityPer,
        cumulativeQty,
        workTimeMin,
        groupName,
        children: [],
        cycleDetected: true,
        bomLineId,
      };
    }

    const nextPath = new Set(path).add(itemId);

    return {
      itemId,
      itemCode: item?.itemCode ?? "?",
      itemName: item?.itemName ?? "알 수 없음",
      itemType: item?.itemType ?? "PART",
      quantityPer,
      cumulativeQty,
      workTimeMin,
      groupName,
      bomLineId,
      children: children.map((line) =>
        build(
          line.childItemId,
          line.quantityPer,
          cumulativeQty * line.quantityPer,
          nextPath,
          line.id,
          line.groupName,
          line.workTimeMin
        )
      ),
    };
  }

  return rootItems.map((root) => build(root.id, 1, 1, new Set(), undefined, null, 0));
}

/**
 * 새 BOM 라인(parentId -> childId)을 추가하기 전, 이미 존재하는 라인들만으로
 * childId의 하위 트리에 parentId가 포함되는지(=순환) 클라이언트에서 사전 검증한다.
 * 최종 방어선은 DB 트리거이지만, 저장 전에 즉시 피드백을 주기 위함.
 */
export function wouldCreateCycle(
  lines: BomLineRow[],
  parentItemId: string,
  childItemId: string
): boolean {
  if (parentItemId === childItemId) return true;

  const linesByParent = new Map<string, BomLineRow[]>();
  for (const line of lines) {
    const arr = linesByParent.get(line.parentItemId) ?? [];
    arr.push(line);
    linesByParent.set(line.parentItemId, arr);
  }

  const visited = new Set<string>();
  const stack = [childItemId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === parentItemId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const line of linesByParent.get(current) ?? []) {
      stack.push(line.childItemId);
    }
  }
  return false;
}
