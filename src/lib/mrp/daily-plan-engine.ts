import type { ItemType } from "@/types/database";

/**
 * 일일 생산계획 자동 생성 알고리즘.
 * 05_아키텍처 4.2절, PRD "생산 일정 생성 규칙" 1~9단계를 구현한다.
 *
 * 단순화한 부분(문서화된 근사):
 * - 개별 작업자 배정(assigned_to)까지는 만들지 않는다. 그룹의 "1일 가용 생산시간"을
 *   headcount × 440분(430~450분의 중간값)으로 근사하고, 그 한도 안에서 품목별 소요시간을
 *   그리디(remaining이 큰 품목부터)로 채워 넣는다. "1인 1~3품목" 제약은 실제 담당자 배정
 *   단계(수동 조정)에서 더 세밀하게 검증하는 것을 권장하며, 여기서는 그룹 단위 총량으로
 *   근사한다.
 * - 캘린더는 주말/휴일을 구분하지 않는다 (연속 일수로 계산).
 */

const MINUTES_PER_WORKER_PER_DAY = 440;
const SEMI_INSPECTION_LEAD_DAYS = 2;

export interface NetRequirementInput {
  itemId: string;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  bomLevel: number;
  netRequirement: number;
}

export interface ItemProductionMeta {
  productionGroupId: string | null;
  workTimeMin: number;
}

export interface GroupMeta {
  id: string;
  headcount: number;
}

export interface GeneratedDailyPlanRow {
  itemId: string;
  productionGroupId: string;
  planDate: string; // YYYY-MM-DD
  plannedQty: number;
  plannedMinutes: number;
  inspectionStartDate: string | null;
  inspectionEndDate: string | null;
}

export interface UnschedulableItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  netRequirement: number;
  reason: string;
}

export interface GenerateScheduleResult {
  rows: GeneratedDailyPlanRow[];
  unschedulable: UnschedulableItem[];
  daySpan: number;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * 하나의 생산그룹, 하나의 레벨 안에서 여러 품목의 소요시간을 날짜별로 그리디하게 채운다.
 * 소요시간이 큰 품목부터 채워 넣어(LPT 유사) 총 소요일수를 최소화한다.
 */
function scheduleGroupItems(
  items: { itemId: string; remainingMinutes: number; workTimeMin: number }[],
  dayCapacity: number,
  startDate: string
): { rowsByItemDay: Map<string, Map<number, number>>; itemLastDayIndex: Map<string, number>; daysUsed: number } {
  const remaining = new Map(items.map((i) => [i.itemId, i.remainingMinutes]));
  const rowsByItemDay = new Map<string, Map<number, number>>(); // itemId -> (dayIndex -> minutes)
  const itemLastDayIndex = new Map<string, number>();

  let dayIndex = 0;
  const maxDays = 365; // 안전장치

  while (Array.from(remaining.values()).some((v) => v > 0.0001) && dayIndex < maxDays) {
    let capacityLeft = dayCapacity;

    // 남은 소요시간이 큰 품목부터 채운다.
    const ordered = items
      .filter((i) => (remaining.get(i.itemId) ?? 0) > 0.0001)
      .sort((a, b) => (remaining.get(b.itemId) ?? 0) - (remaining.get(a.itemId) ?? 0));

    for (const item of ordered) {
      if (capacityLeft <= 0.0001) break;
      const rem = remaining.get(item.itemId) ?? 0;
      const allocated = Math.min(rem, capacityLeft);
      if (allocated <= 0.0001) continue;

      const dayMap = rowsByItemDay.get(item.itemId) ?? new Map<number, number>();
      dayMap.set(dayIndex, (dayMap.get(dayIndex) ?? 0) + allocated);
      rowsByItemDay.set(item.itemId, dayMap);

      remaining.set(item.itemId, rem - allocated);
      capacityLeft -= allocated;
      itemLastDayIndex.set(item.itemId, dayIndex);
    }

    dayIndex += 1;
  }

  return { rowsByItemDay, itemLastDayIndex, daysUsed: dayIndex };
}

export function generateDailySchedule(
  netLines: NetRequirementInput[],
  itemMetaById: Map<string, ItemProductionMeta>,
  groups: GroupMeta[],
  startDate: string
): GenerateScheduleResult {
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const rows: GeneratedDailyPlanRow[] = [];
  const unschedulable: UnschedulableItem[] = [];

  const schedulable = netLines.filter((line) => line.netRequirement > 0);
  const levels = Array.from(new Set(schedulable.map((l) => l.bomLevel))).sort((a, b) => b - a); // 깊은 레벨(부품)부터

  let levelStartDate = startDate;
  let totalDaySpan = 0;

  for (const level of levels) {
    const levelLines = schedulable.filter((l) => l.bomLevel === level);

    // 이 레벨의 품목을 생산그룹별로 묶는다.
    const byGroup = new Map<string, NetRequirementInput[]>();
    for (const line of levelLines) {
      const meta = itemMetaById.get(line.itemId);
      if (!meta?.productionGroupId || !meta.workTimeMin || meta.workTimeMin <= 0) {
        unschedulable.push({
          itemId: line.itemId,
          itemCode: line.itemCode,
          itemName: line.itemName,
          netRequirement: line.netRequirement,
          reason: "생산그룹 또는 작업소요시간이 지정되지 않아 자동 배정할 수 없습니다.",
        });
        continue;
      }
      const arr = byGroup.get(meta.productionGroupId) ?? [];
      arr.push(line);
      byGroup.set(meta.productionGroupId, arr);
    }

    let levelDuration = 0;
    let levelHasSemi = false;

    for (const [groupId, lines] of byGroup.entries()) {
      const group = groupById.get(groupId);
      if (!group || group.headcount <= 0) {
        for (const line of lines) {
          unschedulable.push({
            itemId: line.itemId,
            itemCode: line.itemCode,
            itemName: line.itemName,
            netRequirement: line.netRequirement,
            reason: "생산그룹의 근무인원이 0명이라 자동 배정할 수 없습니다.",
          });
        }
        continue;
      }

      const dayCapacity = group.headcount * MINUTES_PER_WORKER_PER_DAY;
      const items = lines.map((l) => {
        const meta = itemMetaById.get(l.itemId)!;
        return { itemId: l.itemId, remainingMinutes: l.netRequirement * meta.workTimeMin, workTimeMin: meta.workTimeMin };
      });

      const { rowsByItemDay, itemLastDayIndex, daysUsed } = scheduleGroupItems(items, dayCapacity, levelStartDate);
      levelDuration = Math.max(levelDuration, daysUsed);

      for (const line of lines) {
        if (line.itemType === "SEMI") levelHasSemi = true;
        const meta = itemMetaById.get(line.itemId)!;
        const dayMap = rowsByItemDay.get(line.itemId) ?? new Map();
        const lastDayIndex = itemLastDayIndex.get(line.itemId);
        const inspectionStartDate =
          line.itemType === "SEMI" && lastDayIndex !== undefined ? addDays(levelStartDate, lastDayIndex) : null;
        const inspectionEndDate = inspectionStartDate ? addDays(inspectionStartDate, SEMI_INSPECTION_LEAD_DAYS) : null;

        for (const [dayIdx, minutes] of dayMap.entries()) {
          const qty = Math.round((minutes / meta.workTimeMin) * 100) / 100;
          if (qty <= 0) continue;
          rows.push({
            itemId: line.itemId,
            productionGroupId: groupId,
            planDate: addDays(levelStartDate, dayIdx),
            plannedQty: qty,
            plannedMinutes: Math.round(minutes * 100) / 100,
            inspectionStartDate,
            inspectionEndDate,
          });
        }
      }
    }

    const leadTime = levelHasSemi ? SEMI_INSPECTION_LEAD_DAYS : 0;
    totalDaySpan += levelDuration + leadTime;
    levelStartDate = addDays(levelStartDate, levelDuration + leadTime);
  }

  return { rows, unschedulable, daySpan: totalDaySpan };
}
