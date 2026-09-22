import type { ItemType } from "@/types/database";

export interface ItemOption {
  id: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
}

export interface ProductionGroupOption {
  id: string;
  groupName: string;
}

export interface BomLineRow {
  id: string;
  parentItemId: string;
  parentItemCode: string;
  parentItemName: string;
  childItemId: string;
  childItemCode: string;
  childItemName: string;
  childItemType: ItemType;
  quantityPer: number;
  workTimeMin: number;
  groupName: string | null;
}

export interface BomTreeNode {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  quantityPer: number; // 바로 위 상위품목 1개 기준 소요수량
  cumulativeQty: number; // 최상위 완제품 1개 기준 누적 소요수량
  workTimeMin: number;
  groupName: string | null;
  children: BomTreeNode[];
  cycleDetected?: boolean;
  bomLineId?: string; // 이 노드를 자품목으로 연결하는 bom_lines.id (루트는 없음)
}

export interface BomData {
  items: ItemOption[];
  groups: ProductionGroupOption[];
  lines: BomLineRow[];
  forest: BomTreeNode[];
  isDemoData: boolean;
}

export interface ImportRowError {
  row: number;
  reason: string;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedRows: ImportRowError[];
}
