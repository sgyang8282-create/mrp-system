import type { BomData, BomLineRow, ItemOption, ProductionGroupOption } from "@/types/bom";
import { buildBomForest } from "@/lib/bom/tree";

const items: ItemOption[] = [
  { id: "FG-A", itemCode: "FG-A", itemName: "완제품A", itemType: "FINISHED" },
  { id: "SF-B", itemCode: "SF-B", itemName: "반제품B", itemType: "SEMI" },
  { id: "SF-E", itemCode: "SF-E", itemName: "반제품E", itemType: "SEMI" },
  { id: "PT-C", itemCode: "PT-C", itemName: "부품C", itemType: "PART" },
  { id: "PT-D", itemCode: "PT-D", itemName: "부품D", itemType: "PART" },
  { id: "PT-F", itemCode: "PT-F", itemName: "부품F", itemType: "PART" },
];

const groups: ProductionGroupOption[] = [
  { id: "grp-injection1", groupName: "사출1조" },
  { id: "grp-assembly1", groupName: "조립1조" },
  { id: "grp-assembly2", groupName: "조립2조" },
  { id: "grp-process1", groupName: "가공1조" },
];

const lines: BomLineRow[] = [
  {
    id: "bom-1",
    parentItemId: "FG-A",
    parentItemCode: "FG-A",
    parentItemName: "완제품A",
    childItemId: "SF-B",
    childItemCode: "SF-B",
    childItemName: "반제품B",
    childItemType: "SEMI",
    quantityPer: 1,
    workTimeMin: 12,
    groupName: "조립1조",
  },
  {
    id: "bom-2",
    parentItemId: "FG-A",
    parentItemCode: "FG-A",
    parentItemName: "완제품A",
    childItemId: "SF-E",
    childItemCode: "SF-E",
    childItemName: "반제품E",
    childItemType: "SEMI",
    quantityPer: 1,
    workTimeMin: 8,
    groupName: "조립2조",
  },
  {
    id: "bom-3",
    parentItemId: "SF-B",
    parentItemCode: "SF-B",
    parentItemName: "반제품B",
    childItemId: "PT-C",
    childItemCode: "PT-C",
    childItemName: "부품C",
    childItemType: "PART",
    quantityPer: 2,
    workTimeMin: 3,
    groupName: "사출1조",
  },
  {
    id: "bom-4",
    parentItemId: "SF-B",
    parentItemCode: "SF-B",
    parentItemName: "반제품B",
    childItemId: "PT-D",
    childItemCode: "PT-D",
    childItemName: "부품D",
    childItemType: "PART",
    quantityPer: 1,
    workTimeMin: 4,
    groupName: "사출1조",
  },
  {
    id: "bom-5",
    parentItemId: "SF-E",
    parentItemCode: "SF-E",
    parentItemName: "반제품E",
    childItemId: "PT-F",
    childItemCode: "PT-F",
    childItemName: "부품F",
    childItemType: "PART",
    quantityPer: 3,
    workTimeMin: 5,
    groupName: "가공1조",
  },
];

export function getDemoBomData(): BomData {
  return {
    items,
    groups,
    lines,
    forest: buildBomForest(items, lines),
    isDemoData: true,
  };
}
