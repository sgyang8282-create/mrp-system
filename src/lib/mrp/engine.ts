import type { ItemType } from "@/types/database";

export interface BomEdge {
  parentItemId: string;
  childItemId: string;
  quantityPer: number;
}

export interface ExplodedLine {
  itemId: string;
  grossRequirement: number;
  bomLevel: number; // 처음 도달한 깊이 (표시용, 다이아몬드 구조에서는 근사치)
}

/**
 * 완제품 계획수량을 다단계 BOM을 따라 재귀적으로 전개해 품목별 총소요량을 계산한다.
 * 05_아키텍처 4.1절 알고리즘의 2)단계에 해당.
 * 순환참조는 DB 트리거가 원천 차단하지만, 계산 엔진 레벨에서도 경로(path) 기반으로
 * 무한 재귀를 방지한다.
 */
export function explodeRequirements(
  planLines: { itemId: string; qty: number }[],
  bomLines: BomEdge[]
): Map<string, ExplodedLine> {
  const childrenByParent = new Map<string, BomEdge[]>();
  for (const edge of bomLines) {
    const arr = childrenByParent.get(edge.parentItemId) ?? [];
    arr.push(edge);
    childrenByParent.set(edge.parentItemId, arr);
  }

  const result = new Map<string, ExplodedLine>();

  function addRequirement(itemId: string, qty: number, level: number) {
    const existing = result.get(itemId);
    if (existing) {
      existing.grossRequirement += qty;
      existing.bomLevel = Math.min(existing.bomLevel, level);
    } else {
      result.set(itemId, { itemId, grossRequirement: qty, bomLevel: level });
    }
  }

  function walk(itemId: string, qty: number, level: number, path: Set<string>) {
    addRequirement(itemId, qty, level);
    if (path.has(itemId)) return; // 순환 방어

    const nextPath = new Set(path).add(itemId);
    for (const edge of childrenByParent.get(itemId) ?? []) {
      walk(edge.childItemId, qty * edge.quantityPer, level + 1, nextPath);
    }
  }

  for (const plan of planLines) {
    walk(plan.itemId, plan.qty, 0, new Set());
  }

  return result;
}

export interface NetRequirementLine extends ExplodedLine {
  onHandQty: number;
  netRequirement: number;
}

/** 총소요량에서 현재고를 차감해 순소요량을 계산한다 (음수는 0으로 클램프). */
export function computeNetRequirements(
  gross: Map<string, ExplodedLine>,
  inventoryByItem: Map<string, number>
): NetRequirementLine[] {
  return Array.from(gross.values()).map((line) => {
    const onHandQty = inventoryByItem.get(line.itemId) ?? 0;
    const netRequirement = Math.max(0, line.grossRequirement - onHandQty);
    return { ...line, onHandQty, netRequirement };
  });
}

export interface CapaItemMeta {
  itemId: string;
  productionGroupId: string | null;
  workTimeMin: number;
}

export interface CapaGroupMeta {
  id: string;
  groupName: string;
  availableMinutes: number;
}

export interface CapaLoadResult {
  groupId: string;
  groupName: string;
  availableMinutes: number;
  requiredMinutes: number;
  loadPct: number;
}

/**
 * 순소요량 × 단위 작업소요시간을 생산그룹별로 집계해 부하율을 계산한다.
 * (이미 재고로 충당 가능한 수량은 net=0이 되어 소요시간에서 자동 제외된다.)
 */
export function computeCapaLoads(
  netLines: NetRequirementLine[],
  itemMetaById: Map<string, CapaItemMeta>,
  groups: CapaGroupMeta[]
): CapaLoadResult[] {
  const requiredByGroup = new Map<string, number>();

  for (const line of netLines) {
    if (line.netRequirement <= 0) continue;
    const meta = itemMetaById.get(line.itemId);
    if (!meta?.productionGroupId) continue;
    const minutes = line.netRequirement * meta.workTimeMin;
    requiredByGroup.set(meta.productionGroupId, (requiredByGroup.get(meta.productionGroupId) ?? 0) + minutes);
  }

  return groups.map((group) => {
    const requiredMinutes = requiredByGroup.get(group.id) ?? 0;
    const loadPct =
      group.availableMinutes > 0 ? Math.round((requiredMinutes / group.availableMinutes) * 1000) / 10 : 0;
    return {
      groupId: group.id,
      groupName: group.groupName,
      availableMinutes: group.availableMinutes,
      requiredMinutes: Math.round(requiredMinutes * 100) / 100,
      loadPct,
    };
  });
}

export interface ItemMetaForDisplay {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
}
