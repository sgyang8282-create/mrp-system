export interface DashboardKpis {
  achievementRate: number; // 생산달성률 (%)
  shortageRiskCount: number; // 결품위험 건수 (3일 이내 품절 예상)
  lowStockCount: number; // 재고부족 건수 (예상재고 < 0)
  capaOverGroupCount: number; // CAPA 100% 초과 그룹 수
  lastUpdatedAt: string;
}

export interface CapaLoadItem {
  groupName: string;
  availableMinutes: number;
  requiredMinutes: number;
  loadPct: number;
}

export interface TopPlanItem {
  itemCode: string;
  itemName: string;
  planQty: number;
}

export interface ShortageRiskItem {
  itemCode: string;
  itemName: string;
  expectedQty: number;
  daysUntilShortage: number;
  alertLevel: "WARNING" | "CRITICAL";
}

export interface DashboardData {
  kpis: DashboardKpis;
  capaLoads: CapaLoadItem[];
  topPlans: TopPlanItem[];
  shortageRisks: ShortageRiskItem[];
  isDemoData: boolean;
}
