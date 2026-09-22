import type { PvaData, PvaDailyTotal, PvaRow } from "@/types/plan-vs-actual";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function getDemoPvaData(dateFrom: string, dateTo: string): PvaData {
  const items = [
    { itemId: "PT-C", itemCode: "PT-C", itemName: "부품C", groupName: "사출1조", plan: 200 },
    { itemId: "PT-D", itemCode: "PT-D", itemName: "부품D", groupName: "사출1조", plan: 100 },
    { itemId: "SF-B", itemCode: "SF-B", itemName: "반제품B", groupName: "조립1조", plan: 65 },
    { itemId: "PT-F", itemCode: "PT-F", itemName: "부품F", groupName: "가공1조", plan: 150 },
  ];

  const rows: PvaRow[] = [];
  const dailyTotals: PvaDailyTotal[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = isoDaysAgo(i);
    let plannedSum = 0;
    let actualSum = 0;
    for (const item of items) {
      const achievementFactor = 0.85 + ((i * 7 + item.plan) % 20) / 100; // 0.85~1.05 사이 의사난수
      const actual = Math.round(item.plan * Math.min(1, achievementFactor));
      plannedSum += item.plan;
      actualSum += actual;
      rows.push({
        planDate: date,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        groupName: item.groupName,
        plannedQty: item.plan,
        actualQty: actual,
        actualDefectQty: Math.round(actual * 0.02),
        achievementPct: Math.round((actual / item.plan) * 1000) / 10,
      });
    }
    dailyTotals.push({ date, plannedQty: plannedSum, actualQty: actualSum });
  }

  return { dateFrom, dateTo, rows, dailyTotals, isDemoData: true };
}
