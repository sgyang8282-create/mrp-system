import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { CapaLoadChart } from "@/components/dashboard/capa-load-chart";
import { TopPlanList } from "@/components/dashboard/top-plan-list";
import { ShortageRiskList } from "@/components/dashboard/shortage-risk-list";
import { getDashboardData } from "@/lib/services/dashboard";

export const revalidate = 0; // 항상 최신 상태 조회 (현장 실시간성 요구사항)

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-4">
      {data.isDemoData && (
        <div className="rounded border border-signal-warning/40 bg-signal-warning/10 px-3 py-2 text-xs text-signal-warning">
          Supabase 연결 정보가 설정되지 않아 데모 데이터를 표시하고 있습니다.
          `.env.local`에 Supabase 프로젝트 정보를 입력하면 실제 데이터로 전환됩니다.
        </div>
      )}

      <KpiGrid kpis={data.kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CAPA 부하율 (생산그룹별)</CardTitle>
          </CardHeader>
          <CardContent>
            <CapaLoadChart data={data.capaLoads} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>결품위험 TOP10</CardTitle>
          </CardHeader>
          <CardContent>
            <ShortageRiskList items={data.shortageRisks} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>생산계획 TOP10 (이번 달)</CardTitle>
        </CardHeader>
        <CardContent>
          <TopPlanList items={data.topPlans} />
        </CardContent>
      </Card>
    </div>
  );
}
