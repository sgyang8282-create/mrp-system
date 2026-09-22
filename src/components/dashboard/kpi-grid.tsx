import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatPercent } from "@/lib/utils";
import type { DashboardKpis } from "@/types/dashboard";

export function KpiGrid({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard
        label="생산달성률 (이번 달)"
        value={formatPercent(kpis.achievementRate)}
        tone={kpis.achievementRate >= 95 ? "good" : kpis.achievementRate >= 85 ? "accent" : "warning"}
      />
      <KpiCard
        label="결품위험 건수"
        value={String(kpis.shortageRiskCount)}
        unit="건"
        tone={kpis.shortageRiskCount > 0 ? "warning" : "good"}
        hint="3일 이내 품절 예상"
      />
      <KpiCard
        label="재고부족 건수"
        value={String(kpis.lowStockCount)}
        unit="건"
        tone={kpis.lowStockCount > 0 ? "critical" : "good"}
        hint="예상재고 < 0"
      />
      <KpiCard
        label="CAPA 초과 그룹"
        value={String(kpis.capaOverGroupCount)}
        unit="개 그룹"
        tone={kpis.capaOverGroupCount > 0 ? "critical" : "good"}
        hint="부하율 100% 초과"
      />
    </div>
  );
}
