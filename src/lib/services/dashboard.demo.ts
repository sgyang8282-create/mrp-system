import type { DashboardData } from "@/types/dashboard";

/**
 * 04_DDL_제조업_MRP시스템.sql 의 샘플 데이터(완제품A/반제품B,E/부품C,D,F, 생산그룹 4개)를
 * 바탕으로 만든 데모 값. Supabase 미연결 상태(로컬 프리뷰, 최초 셋업 전)에서도
 * 대시보드 레이아웃/차트를 바로 확인할 수 있도록 제공한다.
 */
export function getDemoDashboardData(): DashboardData {
  return {
    kpis: {
      achievementRate: 92.4,
      shortageRiskCount: 3,
      lowStockCount: 2,
      capaOverGroupCount: 1,
      lastUpdatedAt: new Date().toISOString(),
    },
    capaLoads: [
      { groupName: "사출1조", availableMinutes: 48400, requiredMinutes: 51200, loadPct: 105.8 },
      { groupName: "조립1조", availableMinutes: 82720, requiredMinutes: 74100, loadPct: 89.6 },
      { groupName: "조립2조", availableMinutes: 61680, requiredMinutes: 49800, loadPct: 80.8 },
      { groupName: "가공1조", availableMinutes: 38560, requiredMinutes: 21200, loadPct: 55.0 },
    ],
    topPlans: [
      { itemCode: "FG-A", itemName: "완제품A", planQty: 1000 },
      { itemCode: "SF-B", itemName: "반제품B", planQty: 980 },
      { itemCode: "SF-E", itemName: "반제품E", planQty: 950 },
      { itemCode: "PT-C", itemName: "부품C", planQty: 1960 },
      { itemCode: "PT-D", itemName: "부품D", planQty: 980 },
      { itemCode: "PT-F", itemName: "부품F", planQty: 2850 },
    ],
    shortageRisks: [
      { itemCode: "PT-F", itemName: "부품F", expectedQty: -120, daysUntilShortage: 0, alertLevel: "CRITICAL" },
      { itemCode: "SF-E", itemName: "반제품E", expectedQty: -45, daysUntilShortage: 1, alertLevel: "CRITICAL" },
      { itemCode: "PT-C", itemName: "부품C", expectedQty: 80, daysUntilShortage: 2, alertLevel: "WARNING" },
      { itemCode: "SF-B", itemName: "반제품B", expectedQty: 40, daysUntilShortage: 3, alertLevel: "WARNING" },
      { itemCode: "PT-D", itemName: "부품D", expectedQty: 65, daysUntilShortage: 3, alertLevel: "WARNING" },
    ],
    isDemoData: true,
  };
}
